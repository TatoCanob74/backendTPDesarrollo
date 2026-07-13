<<<<<<< HEAD
import { Reserve } from '../models/Reserva.js';
import { Court } from '../models/cancha.js';
import { Horary } from '../models/Horario.js';
import { Service } from '../models/Servicio.js';

// Crear una nueva reserva
export const createReserve = async (req, res) => {
  try {
    const { typeCourt, idLocateCourt, dateReserve, day, idHorary, services } = req.body;
    const idUser = req.user.idUser; // Viene del JWT (middleware verifyToken)

    if (!typeCourt || !idLocateCourt || !dateReserve || !day || !idHorary) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    // 1. Buscar una cancha disponible según tipo y localidad
=======
import { Reserve } from "../models/Reserva.js";
import { Court } from "../models/cancha.js";
import { Horary } from "../models/Horario.js";
import { Service } from "../models/Servicio.js";

export const createReserve = async (req, res) => {
  try {
    const { typeCourt, idLocateCourt, day, idHorary, services } = req.body;
    const idUser = req.user.idUser; 

>>>>>>> origin/rama/Francisco
    const court = await Court.findOne({
      where: {
        typeCourt,
        idLocateCourt,
        stateCourt: 'DISPONIBLE'
      }
    });

    if (!court) {
<<<<<<< HEAD
      return res.status(404).json({ message: 'No hay canchas disponibles para ese tipo y localidad' });
    }

    // 2. Verificar que el horario exista y pertenezca a esa cancha
=======
      return res.status(404).json({ error: "No hay canchas disponibles para ese tipo y localidad." });
    }

>>>>>>> origin/rama/Francisco
    const horary = await Horary.findOne({
      where: {
        idHorary,
        idCourt: court.idCourt,
        day
      }
    });

    if (!horary) {
<<<<<<< HEAD
      return res.status(404).json({ message: 'El horario no está disponible para esa cancha' });
    }

    // 3. Verificar que ese horario no esté ya reservado en esa fecha
    const existingReserve = await Reserve.findOne({
      where: {
        idCourt: court.idCourt,
        idHorary,
        dateReserve,
        stateReserva: ['pendiente', 'confirmada']
      }
    });

    if (existingReserve) {
      return res.status(409).json({ message: 'Ese horario ya está reservado para esa fecha' });
    }

    // 4. Buscar los servicios seleccionados (opcional)
=======
      return res.status(404).json({ error: "El horario no está disponible para esa cancha." });
    }

    const dateReserve = req.body.dateReserve;
    const reservaExistente = await Reserve.findOne({
      where: {
        idCourt: court.idCourt,
        idHorary,
        dateReserve
      }
    });

    if (reservaExistente) {
      return res.status(409).json({ error: "Ese horario ya está reservado para esa fecha." });
    }

    let totalAmount = parseFloat(court.hourlyPrice);

>>>>>>> origin/rama/Francisco
    let selectedServices = [];
    if (services && services.length > 0) {
      selectedServices = await Service.findAll({
        where: { idService: services }
      });
<<<<<<< HEAD
      if (selectedServices.length !== services.length) {
        return res.status(400).json({ message: 'Uno o más servicios no existen' });
      }
    }

    // 5. Calcular el monto total (precio cancha + servicios si hay)
    const totalServices = selectedServices.reduce(
      (acc, s) => acc + parseFloat(s.priceService),
      0
    );
    const totalAmount = parseFloat(court.hourlyPrice) + totalServices;

    // 6. Crear la reserva
    const newReserve = await Reserve.create({
      dateReserve,
      totalAmount,
=======
      const totalServices = selectedServices.reduce((acc, s) => acc + parseFloat(s.priceService), 0);
      totalAmount += totalServices;
    }

    const newReserve = await Reserve.create({
      dateReserve,
      totalAmount,
      stateReserva: 'pendiente',
>>>>>>> origin/rama/Francisco
      idUser,
      idCourt: court.idCourt,
      idHorary
    });

<<<<<<< HEAD
    // 7. Asociar los servicios a la reserva (tabla intermedia ReserveService)
=======
>>>>>>> origin/rama/Francisco
    if (selectedServices.length > 0) {
      await newReserve.addServices(selectedServices);
    }

<<<<<<< HEAD
    const fullReserve = await Reserve.findByPk(newReserve.idReserve, {
      include: [Court, Horary, Service]
    });

    res.status(201).json({
      message: "Reserva creada exitosamente.",
      reserve: fullReserve
    });

  } catch (error) {
    res.status(500).json({ message: "Error al crear la reserva", error: error.message });
  }
};

export default createReserve;
=======
    res.status(201).json({
      message: "Reserva creada exitosamente.",
      reserve: newReserve
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelReserve = async (req, res) => {
  try {
    const { id } = req.params;
    const idUser = req.user.idUser; 

    const reserve = await Reserve.findByPk(id);

    if (!reserve) {
      return res.status(404).json({ error: "Reserva no encontrada." });
    }

    if (reserve.idUser !== idUser) {
      return res.status(403).json({ error: "No podés cancelar una reserva que no es tuya." });
    }

    if (reserve.stateReserve !== 'pendiente') {
      return res.status(400).json({ error: "Solo podés cancelar reservas pendientes." });
    }

    const horary = await Horary.findByPk(reserve.idHorary);
    if (!horary) {
      return res.status(404).json({ error: "Horario no encontrado." });
    }

    const dateHourReserve = new Date(
    `${reserve.dateReserve}T${horary.startTime}`
    );
    const now = new Date();
    const differenceMs = dateHourReserve.getTime() - now.getTime();
    const differenceHours = differenceMs / (1000 * 60 * 60);

    if (differenceHours < 6) {
      return res.status(400).json({ 
       error: "No se puede cancelar la reserva. Debe hacerse con al menos 6 horas de anticipación." 
    });
    }

    await reserve.update({ stateReserva: 'cancelada' });

    res.status(200).json({ message: "Reserva cancelada exitosamente." });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const seeMyReserves = async (req, res) => {
  try {
    const idUser = req.user.idUser; 

    const filters = { idUser };

    if (req.query.stateReserva) {
      filters.stateReserva = req.query.stateReserva;
    }

    const reserves = await Reserve.findAll({
      where: filters
    });

    if (reserves.length === 0) {
      return res.status(404).json({ message: "No tenés reservas." });
    }

    res.status(200).json(reserves);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
>>>>>>> origin/rama/Francisco
