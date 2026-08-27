import { Reserve, Court } from '../models/association.js';
import { Horary } from '../models/Horario.js';
import { Service } from '../models/Servicio.js';
import { Op } from "sequelize";

const DAY_BY_INDEX = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Crear una nueva reserva
export const createReserve = async (req, res) => {
  try {
    const { typeCourt, idLocateCourt, dateReserve, day, idHorary, services } = req.body;
    const idUser = req.user.idUser; // Viene del JWT (middleware verifyToken)

    if (!typeCourt || !idLocateCourt || !dateReserve || !day || !idHorary) {
      return res.status(400).json({ message: 'Faltan datos obligatorios' });
    }

    if (!DATE_REGEX.test(dateReserve)) {
      return res.status(400).json({ error: "Formato de fecha inválido. Usá AAAA-MM-DD." });
    }

    const [year, month, dayNum] = dateReserve.split("-").map(Number);
    const reserveDate = new Date(Date.UTC(year, month - 1, dayNum));

    if (isNaN(reserveDate.getTime())) {
      return res.status(400).json({ error: "La fecha ingresada no es válida." });
    }

    const today = new Date();
    const todayOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

    if (reserveDate < todayOnly) {
      return res.status(400).json({ error: "No se puede reservar en una fecha pasada." });
    }

    const realDay = DAY_BY_INDEX[reserveDate.getUTCDay()];
    if (realDay !== day) {
      return res.status(400).json({ error: `La fecha ingresada corresponde a un ${realDay}, no a un ${day}.` });
    }

    // 1. Buscar una cancha disponible según tipo y localidad
    const court = await Court.findOne({
      where: {
        typeCourt,
        idLocateCourt,
        stateCourt: 'DISPONIBLE'
      }
    });

    if (!court) {
      return res.status(404).json({ error: "No hay canchas disponibles para ese tipo y localidad." });
    }

    const horary = await Horary.findOne({
      where: {
        idHorary,
        idCourt: court.idCourt,
        day
      }
    });

    if (!horary) {
      return res.status(404).json({ error: "El horario no está disponible para esa cancha." });
    }

    const reservaExistente = await Reserve.findOne({
      where: {
        idCourt: court.idCourt,
        idHorary,
        dateReserve,
        stateReserva: { [Op.ne]: 'cancelada' }
      }
    });

    if (reservaExistente) {
      return res.status(409).json({ error: "Ese horario ya está reservado para esa fecha." });
    }

    let totalAmount = Number(court.hourlyPrice);

    let selectedServices = [];
    if (services && services.length > 0) {
      selectedServices = await Service.findAll({
        where: { idService: services }
      });

      if (selectedServices.length !== services.length) {
        return res.status(404).json({ error: "Uno o más servicios seleccionados no existen." });
      }

      const totalServices = selectedServices.reduce((acc, s) => acc + Number(s.priceService), 0);
      totalAmount += totalServices;
    }

    const newReserve = await Reserve.create({
      dateReserve,
      totalAmount,
      stateReserva: 'pendiente',
      idUser,
      idCourt: court.idCourt,
      idHorary,
      paymentId: null,
      paymentStatus: null
    });

    if (selectedServices.length > 0) {
      await newReserve.addServicios(selectedServices);
    }

    const fullReserve = await Reserve.findByPk(newReserve.idReserve, {
      include: [
        Court,
        Horary,
        {
          model: Service,
          as: "Servicios"
        }
      ]
    });

    res.status(201).json({
      message: "Reserva creada exitosamente.",
      reserve: fullReserve
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

    if (reserve.stateReserva !== 'pendiente') {
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
      where: filters,
      include: [Court, Horary]
    });

    if (reserves.length === 0) {
      return res.status(404).json({ message: "No tenés reservas." });
    }

    res.status(200).json(reserves);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /admin/reservas/:id/estado — el admin confirma o cancela una reserva
export const updateReserveState = async (req, res) => {
  try {
    const { id } = req.params;
    const { stateReserva } = req.body;

    const validStates = ["pendiente", "confirmada", "cancelada"];
    if (!validStates.includes(stateReserva)) {
      return res.status(400).json({ error: "Estado inválido. Debe ser pendiente, confirmada o cancelada." });
    }

    const reserve = await Reserve.findByPk(id);
    if (!reserve) {
      return res.status(404).json({ error: "Reserva no encontrada." });
    }

    await reserve.update({ stateReserva });

    res.status(200).json({ message: `Reserva actualizada a estado ${stateReserva}.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /admin/reservas/:id — eliminar reserva (admin)
export const deleteReserve = async (req, res) => {
  try {
    const { id } = req.params;

    const reserve = await Reserve.findByPk(id);
    if (!reserve) {
      return res.status(404).json({ error: "Reserva no encontrada." });
    }

    if (reserve.paymentId) {
      return res.status(409).json({
        error: "No se puede eliminar: la reserva tiene un pago asociado."
      });
    }

    await reserve.destroy();
    res.status(200).json({ message: "Reserva eliminada exitosamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};