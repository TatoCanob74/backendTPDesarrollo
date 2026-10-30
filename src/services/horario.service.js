import { Op } from "sequelize";
import { Horary } from "../models/horary.js";
import { Court } from "../models/court.js";
import { Reserve } from "../models/reserve.js";
import { HttpError } from "../utils/httpError.js";
import { normalizeTime } from "../utils/dateTime.js";
import { canManageComplex, FORBIDDEN_COMPLEX } from "../utils/complexScope.js";

const OVERLAP_ERROR = "El horario se superpone con uno ya existente para esa cancha y día.";

// Un horario pertenece a una cancha, y la cancha a un complejo: se sube hasta ahí
const findManageableCourt = async (idCourt, actor) => {
  const court = await Court.findByPk(idCourt);
  if (!court) {
    throw new HttpError(404, "La cancha indicada no existe.");
  }
  if (!canManageComplex(actor, court.idComplex)) {
    throw new HttpError(403, FORBIDDEN_COMPLEX);
  }
  return court;
};

const findManageableHorary = async (idHorary, actor) => {
  const horary = await Horary.findByPk(idHorary, { include: [Court] });
  if (!horary) {
    throw new HttpError(404, "Horario no encontrado.");
  }
  if (!canManageComplex(actor, horary.court.idComplex)) {
    throw new HttpError(403, FORBIDDEN_COMPLEX);
  }
  return horary;
};

const ensureNoOverlap = async ({ idCourt, day, startTime, endTime }, exceptIdHorary = null) => {
  const where = {
    idCourt,
    day,
    startTime: { [Op.lt]: endTime },
    endTime: { [Op.gt]: startTime }
  };
  if (exceptIdHorary !== null) {
    where.idHorary = { [Op.ne]: exceptIdHorary };
  }

  if (await Horary.findOne({ where })) {
    throw new HttpError(409, OVERLAP_ERROR);
  }
};

export const listHoraries = ({ idCourt, day, from, to }) => {
  const filters = {};
  if (idCourt) filters.idCourt = idCourt;
  if (day) filters.day = day;

  if (from || to) {
    filters.startTime = {};
    if (from) filters.startTime[Op.gte] = normalizeTime(from);
    if (to) filters.startTime[Op.lt] = normalizeTime(to);
  }

  return Horary.findAll({
    where: filters,
    order: [["day", "ASC"], ["startTime", "ASC"]]
  });
};

export const createHorary = async ({ idCourt, day, startTime, endTime }, actor) => {
  await findManageableCourt(idCourt, actor);
  await ensureNoOverlap({ idCourt, day, startTime, endTime });

  return Horary.create({ idCourt, day, startTime, endTime });
};

export const updateHorary = async (idHorary, { idCourt, day, startTime, endTime }, actor) => {
  const horary = await findManageableHorary(idHorary, actor);

  const reservasDelHorario = await Reserve.count({ where: { idHorary } });
  if (reservasDelHorario > 0) {
    throw new HttpError(409, "No se puede editar: el horario tiene reservas asociadas.");
  }

  const final = {
    idCourt: idCourt ?? horary.idCourt,
    day: day ?? horary.day,
    startTime: startTime ?? horary.startTime,
    endTime: endTime ?? horary.endTime
  };

  // La base devuelve "HH:MM:SS" y el body puede traer "HH:MM": se comparan normalizadas
  if (normalizeTime(final.startTime) >= normalizeTime(final.endTime)) {
    throw new HttpError(400, "La hora de inicio debe ser anterior a la hora de fin.");
  }

  // Tampoco se puede pasar el horario a una cancha de otro complejo
  if (idCourt) {
    await findManageableCourt(idCourt, actor);
  }

  await ensureNoOverlap(final, idHorary);

  await horary.update(final);
  return horary;
};

export const deleteHorary = async (idHorary, actor) => {
  const horary = await findManageableHorary(idHorary, actor);

  const reservasDelHorario = await Reserve.count({ where: { idHorary } });
  if (reservasDelHorario > 0) {
    throw new HttpError(409, `No se puede eliminar: el horario tiene ${reservasDelHorario} reserva(s) asociada(s).`);
  }

  await horary.destroy();
};
