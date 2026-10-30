import { validate } from "../validate.js";
import { normalizeTime } from "../../utils/dateTime.js";

const VALID_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

const INVALID_DAY = `Día inválido. Debe ser uno de: ${VALID_DAYS.join(", ")}.`;
const INVALID_TIME = "Formato de hora inválido. Usá HH:MM o HH:MM:SS.";

export const validateHoraryFilters = validate(({ query }) => {
  const { from, to } = query;

  if ((from && !TIME_REGEX.test(from)) || (to && !TIME_REGEX.test(to))) {
    return "Formato de hora inválido en el filtro. Usá HH:MM o HH:MM:SS.";
  }

  if (from && to && normalizeTime(from) >= normalizeTime(to)) {
    return "La hora desde debe ser anterior a la hora hasta.";
  }
  return null;
});

export const validateCreateHorary = validate(({ body = {} }) => {
  const { idCourt, day, startTime, endTime } = body;

  if (!idCourt || !day || !startTime || !endTime) {
    return "Todos los campos son obligatorios.";
  }

  if (!VALID_DAYS.includes(day)) return INVALID_DAY;

  if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) return INVALID_TIME;

  // Normalizadas: comparar "11:00" con "11:00:00" como texto da que la primera es menor
  if (normalizeTime(startTime) >= normalizeTime(endTime)) {
    return "La hora de inicio debe ser anterior a la hora de fin.";
  }
  return null;
});

// Edición parcial: solo se valida el formato de lo que vino. Que el inicio quede antes del
// fin lo chequea el servicio, porque puede depender de la hora que ya está guardada.
export const validateUpdateHorary = validate(({ body = {} }) => {
  const { day, startTime, endTime } = body;

  if (day && !VALID_DAYS.includes(day)) return INVALID_DAY;

  if ((startTime && !TIME_REGEX.test(startTime)) || (endTime && !TIME_REGEX.test(endTime))) {
    return INVALID_TIME;
  }
  return null;
});
