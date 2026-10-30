import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { Reserve, Court, Complex, Location, User } from "../models/association.js";
import { Horary } from "../models/horary.js";
import { Service } from "../models/service.js";
import { HttpError } from "../utils/httpError.js";
import { dateFromISO, todayUTC } from "../utils/dateTime.js";
import { canManageComplex, complexFilter, FORBIDDEN_COMPLEX } from "../utils/complexScope.js";
import { expireStaleReserves } from "./pago.service.js";

const MIN_HOURS_TO_CANCEL = 6;

const COURT_WITH_LOCATION = { model: Court, include: [{ model: Complex, include: [Location] }] };

// Busca la reserva con su cancha y verifica que el admin pueda operar sobre ese complejo
const findManageableReserve = async (idReserve, actor) => {
  const reserve = await Reserve.findByPk(idReserve, { include: [Court] });
  if (!reserve) {
    throw new HttpError(404, "Reserva no encontrada.");
  }
  if (!canManageComplex(actor, reserve.court.idComplex)) {
    throw new HttpError(403, FORBIDDEN_COMPLEX);
  }
  return reserve;
};

// Si la reserva es para hoy, el horario todavía no tiene que haber empezado
const ensureHoraryNotStarted = (dateReserve, horary) => {
  if (dateFromISO(dateReserve).getTime() !== todayUTC().getTime()) return;

  const [startHour, startMinute] = String(horary.startTime).split(":").map(Number);
  const now = new Date();
  const startedMinutes = startHour * 60 + startMinute;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  if (startedMinutes <= nowMinutes) {
    throw new HttpError(400, "Ese horario ya pasó. Elegí una franja posterior o cambiá la fecha.");
  }
};

export const createReserve = async ({ typeCourt, idLocation, dateReserve, day, idHorary, services }, idUser) => {
  const horary = await Horary.findByPk(idHorary);

  if (!horary) {
    throw new HttpError(404, "El horario indicado no existe.");
  }

  if (horary.day !== day) {
    throw new HttpError(400, `El horario seleccionado corresponde a un ${horary.day}, no a un ${day}.`);
  }

  const court = await Court.findByPk(horary.idCourt, { include: [Complex] });

  if (!court) {
    throw new HttpError(404, "La cancha del horario seleccionado no existe.");
  }

  if (court.typeCourt !== typeCourt) {
    throw new HttpError(400, "El horario seleccionado no corresponde a ese tipo de cancha.");
  }

  if (String(court.complex.idLocation) !== String(idLocation)) {
    throw new HttpError(400, "El horario seleccionado no corresponde a esa localidad.");
  }

  if (court.stateCourt !== "DISPONIBLE") {
    throw new HttpError(409, "La cancha no está disponible para reservar.");
  }

  ensureHoraryNotStarted(dateReserve, horary);

  // Si el horario lo retiene una reserva que nunca se pagó, vence acá y queda libre
  await expireStaleReserves({ idCourt: court.idCourt, idHorary, dateReserve });

  const reservaExistente = await Reserve.findOne({
    where: {
      idCourt: court.idCourt,
      idHorary,
      dateReserve,
      stateReserva: { [Op.notIn]: ["cancelada", "vencida"] }
    }
  });

  if (reservaExistente) {
    throw new HttpError(409, "Ese horario ya está reservado para esa fecha.");
  }

  let totalAmount = Number(court.hourlyPrice);

  let selectedServices = [];
  if (services && services.length > 0) {
    selectedServices = await Service.findAll({
      where: { idService: services }
    });

    if (selectedServices.length !== services.length) {
      throw new HttpError(404, "Uno o más servicios seleccionados no existen.");
    }

    totalAmount += selectedServices.reduce((acc, s) => acc + Number(s.priceService), 0);
  }

  // En una transacción: si falla el alta de los servicios no queda una reserva a medias ocupando el horario
  const newReserve = await sequelize.transaction(async (transaction) => {
    const reserve = await Reserve.create({
      dateReserve,
      totalAmount,
      stateReserva: "pendiente",
      idUser,
      idCourt: court.idCourt,
      idHorary,
      paymentId: null,
      paymentStatus: null
    }, { transaction });

    if (selectedServices.length > 0) {
      await reserve.addServices(selectedServices, { transaction });
    }

    return reserve;
  });

  return Reserve.findByPk(newReserve.idReserve, {
    include: [
      Court,
      Horary,
      {
        model: Service,
        as: "services"
      }
    ]
  });
};

export const cancelReserve = async (idReserve, idUser) => {
  const reserve = await Reserve.findByPk(idReserve);

  if (!reserve) {
    throw new HttpError(404, "Reserva no encontrada.");
  }

  if (reserve.idUser !== idUser) {
    throw new HttpError(403, "No podés cancelar una reserva que no es tuya.");
  }

  if (reserve.stateReserva !== "pendiente") {
    throw new HttpError(400, "Solo podés cancelar reservas pendientes.");
  }

  const horary = await Horary.findByPk(reserve.idHorary);
  if (!horary) {
    throw new HttpError(404, "Horario no encontrado.");
  }

  const dateHourReserve = new Date(`${reserve.dateReserve}T${horary.startTime}`);
  const differenceHours = (dateHourReserve.getTime() - Date.now()) / (1000 * 60 * 60);

  if (differenceHours < MIN_HOURS_TO_CANCEL) {
    throw new HttpError(400, `No se puede cancelar la reserva. Debe hacerse con al menos ${MIN_HOURS_TO_CANCEL} horas de anticipación.`);
  }

  await reserve.update({ stateReserva: "cancelada" });
};

export const listUserReserves = (idUser, stateReserva) => {
  const filters = { idUser };
  if (stateReserva) filters.stateReserva = stateReserva;

  return Reserve.findAll({
    where: filters,
    include: [COURT_WITH_LOCATION, Horary]
  });
};

// Detalle de una reserva: la ve su dueño, el admin del complejo de la cancha y el superadmin
export const getReserveById = async (idReserve, { idUser, typeUser }) => {
  const reserve = await Reserve.findByPk(idReserve, {
    include: [
      COURT_WITH_LOCATION,
      Horary,
      { model: Service, as: "services", through: { attributes: [] } },
      { model: User, attributes: ["idUser", "nameUser", "surnameUser", "emailUser", "aliasUser"] }
    ]
  });

  if (!reserve) {
    throw new HttpError(404, "Reserva no encontrada.");
  }

  const isOwner = reserve.idUser === idUser;
  const isAdminOfComplex = typeUser === "ADMIN" && reserve.court?.complex?.idAdmin === idUser;

  if (!isOwner && !isAdminOfComplex && typeUser !== "SUPERADMIN") {
    throw new HttpError(403, "No tenés permiso para ver esta reserva.");
  }

  return reserve;
};

// El filtro por complejo va en el include: la reserva no tiene idComplex, lo tiene su cancha
export const listReservesForAdmin = ({ stateReserva, dateReserve }, actor) => {
  const filters = {};
  if (stateReserva) filters.stateReserva = stateReserva;
  if (dateReserve) filters.dateReserve = dateReserve;

  return Reserve.findAll({
    where: filters,
    include: [{ model: Court, where: complexFilter(actor) }, Horary]
  });
};

export const updateReserveState = async (idReserve, stateReserva, actor) => {
  const reserve = await findManageableReserve(idReserve, actor);
  await reserve.update({ stateReserva });
};

export const deleteReserve = async (idReserve, actor) => {
  const reserve = await findManageableReserve(idReserve, actor);

  if (reserve.paymentId) {
    throw new HttpError(409, "No se puede eliminar: la reserva tiene un pago asociado.");
  }

  await reserve.destroy();
};
