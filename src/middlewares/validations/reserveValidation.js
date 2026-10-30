import { validate } from "../validate.js";
import { dateFromISO, todayUTC } from "../../utils/dateTime.js";

const RESERVE_STATES = ["pendiente", "confirmada", "cancelada", "ausente", "vencida"];
const DAY_BY_INDEX = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const INVALID_DATE_FORMAT = "Formato de fecha inválido. Usá AAAA-MM-DD.";

// Filtros del listado de reservas del panel de administración
export const validateReserveFilters = validate(({ query }) => {
  if (query.stateReserva && !RESERVE_STATES.includes(query.stateReserva)) {
    return `Estado inválido. Debe ser uno de: ${RESERVE_STATES.join(", ")}.`;
  }
  if (query.dateReserve && !DATE_REGEX.test(query.dateReserve)) {
    return INVALID_DATE_FORMAT;
  }
  return null;
});

// Los datos faltantes responden con `message` y el resto con `error`, como antes
const validateRequiredReserveFields = validate(
  ({ body = {} }) => {
    const { typeCourt, dateReserve, day, idHorary } = body;
    const idLocation = body.idLocation ?? body.idLocateCourt;

    return !typeCourt || !idLocation || !dateReserve || !day || !idHorary ? "Faltan datos obligatorios" : null;
  },
  { key: "message" }
);

const validateReserveDate = validate(({ body }) => {
  const { dateReserve, day } = body;

  if (!DATE_REGEX.test(dateReserve)) return INVALID_DATE_FORMAT;

  const reserveDate = dateFromISO(dateReserve);
  if (isNaN(reserveDate.getTime())) {
    return "La fecha ingresada no es válida.";
  }

  if (reserveDate < todayUTC()) {
    return "No se puede reservar en una fecha pasada.";
  }

  const realDay = DAY_BY_INDEX[reserveDate.getUTCDay()];
  if (realDay !== day) {
    return `La fecha ingresada corresponde a un ${realDay}, no a un ${day}.`;
  }
  return null;
});

export const validateCreateReserve = [validateRequiredReserveFields, validateReserveDate];

export const validateReserveState = validate(({ body = {} }) =>
  RESERVE_STATES.includes(body.stateReserva)
    ? null
    : "Estado inválido. Debe ser pendiente, confirmada, cancelada, ausente o vencida."
);
