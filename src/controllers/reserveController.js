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
    const court = await Court.findOne({
      where: {
        typeCourt,
        idLocateCourt,
        stateCourt: 'DISPONIBLE'
      }
    });

    if (!court) {
      return res.status(404).json({ message: 'No hay canchas disponibles para ese tipo y localidad' });
    }

    // 2. Verificar que el horario exista y pertenezca a esa cancha
    const horary = await Horary.findOne({
      where: {
        idHorary,
        idCourt: court.idCourt,
        day
      }
    });

    if (!horary) {
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
    let selectedServices = [];
    if (services && services.length > 0) {
      selectedServices = await Service.findAll({
        where: { idService: services }
      });
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
      idUser,
      idCourt: court.idCourt,
      idHorary
    });

    // 7. Asociar los servicios a la reserva (tabla intermedia ReserveService)
    if (selectedServices.length > 0) {
      await newReserve.addServices(selectedServices);
    }

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
