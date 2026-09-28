import { Reserve, Court, Complex, Location } from '../models/association.js';
import { Horary } from '../models/horary.js';
import { Service } from '../models/service.js';
import { Op } from "sequelize";
import { sendError } from "../utils/httpError.js";
import { canManageComplex, FORBIDDEN_COMPLEX } from "../utils/complexScope.js";

const DAY_BY_INDEX = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const createReserve = async (req, res) => {
  try {
    const { typeCourt, dateReserve, day, idHorary, services } = req.body;
    // La localidad ahora es del complejo. Se sigue aceptando el nombre viejo
    // (idLocateCourt) para no romper al frontend mientras no se actualice.
    const idLocation = req.body.idLocation ?? req.body.idLocateCourt;
    const idUser = req.user.idUser;

    if (!typeCourt || !idLocation || !dateReserve || !day || !idHorary) {
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

    // El horario ya determina la cancha: buscarla por tipo+localidad devolvía siempre la primera
    const horary = await Horary.findByPk(idHorary);

    if (!horary) {
      return res.status(404).json({ error: "El horario indicado no existe." });
    }

    if (horary.day !== day) {
      return res.status(400).json({ error: `El horario seleccionado corresponde a un ${horary.day}, no a un ${day}.` });
    }

    const court = await Court.findByPk(horary.idCourt, { include: [Complex] });

    if (!court) {
      return res.status(404).json({ error: "La cancha del horario seleccionado no existe." });
    }

    if (court.typeCourt !== typeCourt) {
      return res.status(400).json({ error: "El horario seleccionado no corresponde a ese tipo de cancha." });
    }

    if (String(court.complex.idLocation) !== String(idLocation)) {
      return res.status(400).json({ error: "El horario seleccionado no corresponde a esa localidad." });
    }

    if (court.stateCourt !== 'DISPONIBLE') {
      return res.status(409).json({ error: "La cancha no está disponible para reservar." });
    }

    if (reserveDate.getTime() === todayOnly.getTime()) {
      const [startHour, startMinute] = String(horary.startTime).split(":").map(Number);
      const now = new Date();
      const startedMinutes = startHour * 60 + startMinute;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      if (startedMinutes <= nowMinutes) {
        return res.status(400).json({ error: "Ese horario ya pasó. Elegí una franja posterior o cambiá la fecha." });
      }
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
          as: "services"
        }
      ]
    });

    res.status(201).json({
      message: "Reserva creada exitosamente.",
      reserve: fullReserve
    });

  } catch (error) {
    sendError(res, error);
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
    sendError(res, error);
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
      include: [
        { model: Court, include: [{ model: Complex, include: [Location] }] },
        Horary,
      ]
    });

    res.status(200).json(reserves);

  } catch (error) {
    sendError(res, error);
  }
};

export const updateReserveState = async (req, res) => {
  try {
    const { id } = req.params;
    const { stateReserva } = req.body;

    const validStates = ["pendiente", "confirmada", "cancelada"];
    if (!validStates.includes(stateReserva)) {
      return res.status(400).json({ error: "Estado inválido. Debe ser pendiente, confirmada o cancelada." });
    }

    const reserve = await Reserve.findByPk(id, { include: [Court] });
    if (!reserve) {
      return res.status(404).json({ error: "Reserva no encontrada." });
    }

    if (!canManageComplex(req, reserve.court.idComplex)) {
      return res.status(403).json({ error: FORBIDDEN_COMPLEX });
    }

    await reserve.update({ stateReserva });

    res.status(200).json({ message: `Reserva actualizada a estado ${stateReserva}.` });
  } catch (error) {
    sendError(res, error);
  }
};

export const deleteReserve = async (req, res) => {
  try {
    const { id } = req.params;

    const reserve = await Reserve.findByPk(id, { include: [Court] });
    if (!reserve) {
      return res.status(404).json({ error: "Reserva no encontrada." });
    }

    if (!canManageComplex(req, reserve.court.idComplex)) {
      return res.status(403).json({ error: FORBIDDEN_COMPLEX });
    }

    if (reserve.paymentId) {
      return res.status(409).json({
        error: "No se puede eliminar: la reserva tiene un pago asociado."
      });
    }

    await reserve.destroy();
    res.status(200).json({ message: "Reserva eliminada exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};