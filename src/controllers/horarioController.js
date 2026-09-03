import { Horary } from "../models/Horario.js";
import { Court } from "../models/cancha.js";
import { Reserve } from "../models/Reserva.js";
import { Op } from "sequelize";

const VALID_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

/** "08:00" -> "08:00:00", que es el formato con el que MySQL compara los TIME. */
const normalizeTime = (time) => {
  const [hours, minutes, seconds] = time.split(":");
  return `${hours.padStart(2, "0")}:${minutes}:${seconds ?? "00"}`;
};

// GET /horarios?idCourt=&day=&from=&to=
// from/to acotan la franja horaria por hora de inicio (from inclusive, to exclusivo),
// para no tener que listar todos los horarios de una cancha de una sola vez.
export const seeHoraries = async (req, res) => {
  try {
    const filters = {};
    if (req.query.idCourt) {
      filters.idCourt = req.query.idCourt;
    }
    if (req.query.day) {
      filters.day = req.query.day;
    }

    const { from, to } = req.query;

    if ((from && !TIME_REGEX.test(from)) || (to && !TIME_REGEX.test(to))) {
      return res.status(400).json({ error: "Formato de hora inválido en el filtro. Usá HH:MM o HH:MM:SS." });
    }

    if (from && to && normalizeTime(from) >= normalizeTime(to)) {
      return res.status(400).json({ error: "La hora desde debe ser anterior a la hora hasta." });
    }

    if (from || to) {
      filters.startTime = {};
      if (from) filters.startTime[Op.gte] = normalizeTime(from);
      if (to) filters.startTime[Op.lt] = normalizeTime(to);
    }

    const horaries = await Horary.findAll({
      where: filters,
      order: [["day", "ASC"], ["startTime", "ASC"]]
    });

    if (horaries.length === 0) {
      return res.status(404).json({ msg: "No hay horarios cargados." });
    }

    res.status(200).json(horaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /horarios
export const createHorary = async (req, res) => {
  try {
    const { idCourt, day, startTime, endTime } = req.body;

    if (!idCourt || !day || !startTime || !endTime) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    if (!VALID_DAYS.includes(day)) {
      return res.status(400).json({ error: `Día inválido. Debe ser uno de: ${VALID_DAYS.join(", ")}.` });
    }

    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
      return res.status(400).json({ error: "Formato de hora inválido. Usá HH:MM o HH:MM:SS." });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: "La hora de inicio debe ser anterior a la hora de fin." });
    }

    const court = await Court.findByPk(idCourt);
    if (!court) {
      return res.status(404).json({ error: "La cancha indicada no existe." });
    }

    // Busca cualquier horario de esa cancha/día cuyo rango se solape con el nuevo
    const overlapping = await Horary.findOne({
      where: {
        idCourt,
        day,
        startTime: { [Op.lt]: endTime },
        endTime: { [Op.gt]: startTime }
      }
    });
    if (overlapping) {
      return res.status(409).json({ error: "El horario se superpone con uno ya existente para esa cancha y día." });
    }

    const newHorary = await Horary.create({ idCourt, day, startTime, endTime });
    res.status(201).json(newHorary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /horarios/:id
export const updateHorary = async (req, res) => {
  try {
    const { id } = req.params;
    const { idCourt, day, startTime, endTime } = req.body;

    const horary = await Horary.findByPk(id);
    if (!horary) {
      return res.status(404).json({ error: "Horario no encontrado." });
    }

    // Si ya tiene reservas, no dejamos tocar el horario para no dejarlas inconsistentes
    const reservasDelHorario = await Reserve.count({ where: { idHorary: id } });
    if (reservasDelHorario > 0) {
      return res.status(409).json({
        error: "No se puede editar: el horario tiene reservas asociadas."
      });
    }

    const finalIdCourt = idCourt ?? horary.idCourt;
    const finalDay = day ?? horary.day;
    const finalStartTime = startTime ?? horary.startTime;
    const finalEndTime = endTime ?? horary.endTime;

    if (day && !VALID_DAYS.includes(day)) {
      return res.status(400).json({ error: `Día inválido. Debe ser uno de: ${VALID_DAYS.join(", ")}.` });
    }

    if ((startTime && !TIME_REGEX.test(startTime)) || (endTime && !TIME_REGEX.test(endTime))) {
      return res.status(400).json({ error: "Formato de hora inválido. Usá HH:MM o HH:MM:SS." });
    }

    if (finalStartTime >= finalEndTime) {
      return res.status(400).json({ error: "La hora de inicio debe ser anterior a la hora de fin." });
    }

    if (idCourt) {
      const court = await Court.findByPk(idCourt);
      if (!court) {
        return res.status(404).json({ error: "La cancha indicada no existe." });
      }
    }

    const overlapping = await Horary.findOne({
      where: {
        idHorary: { [Op.ne]: id }, // excluirse a sí mismo
        idCourt: finalIdCourt,
        day: finalDay,
        startTime: { [Op.lt]: finalEndTime },
        endTime: { [Op.gt]: finalStartTime }
      }
    });
    if (overlapping) {
      return res.status(409).json({ error: "El horario se superpone con uno ya existente para esa cancha y día." });
    }

    await horary.update({ idCourt: finalIdCourt, day: finalDay, startTime: finalStartTime, endTime: finalEndTime });
    res.status(200).json({ message: "Horario actualizado exitosamente.", horary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /horarios/:id
export const deleteHorary = async (req, res) => {
  try {
    const { id } = req.params;

    const horary = await Horary.findByPk(id);
    if (!horary) {
      return res.status(404).json({ error: "Horario no encontrado." });
    }

    const reservasDelHorario = await Reserve.count({ where: { idHorary: id } });
    if (reservasDelHorario > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: el horario tiene ${reservasDelHorario} reserva(s) asociada(s).`
      });
    }

    await horary.destroy();
    res.status(200).json({ message: "Horario eliminado exitosamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};