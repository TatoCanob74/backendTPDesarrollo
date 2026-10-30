import { validate } from "../validate.js";
import { validarTextos } from "../../utils/validators.js";
import { HttpError } from "../../utils/httpError.js";
import { actorFrom, canManageComplex, targetComplexId, FORBIDDEN_COMPLEX } from "../../utils/complexScope.js";

const COURT_TYPES = ["FUTBOL", "TENIS", "PADEL"];
const COURT_STATES = ["DISPONIBLE", "OCUPADO"];

const PRICE_ERROR = "El precio por hora debe ser un número entero mayor a 0.";
const CAPACITY_ERROR = "La capacidad de jugadores debe ser un número entero mayor a 0.";

const positiveIntegerError = (value, message) =>
  !Number.isInteger(Number(value)) || Number(value) <= 0 ? message : null;

// Filtros del listado de canchas del panel de administración
export const validateCourtFilters = validate(({ query }) => {
  if (query.typeCourt && !COURT_TYPES.includes(query.typeCourt)) {
    return `Tipo de cancha inválido. Debe ser uno de: ${COURT_TYPES.join(", ")}.`;
  }
  if (query.stateCourt && !COURT_STATES.includes(query.stateCourt)) {
    return `Estado de cancha inválido. Debe ser uno de: ${COURT_STATES.join(", ")}.`;
  }
  return null;
});

export const validateCreateCourt = validate((req) => {
  const { typeCourt, nameCourt, hourlyPrice, capacityPlayers } = req.body ?? {};
  const actor = actorFrom(req);
  const idComplex = targetComplexId(actor, req.body?.idComplex);

  if (!typeCourt || !nameCourt || !hourlyPrice || !capacityPlayers || !idComplex) {
    return "Todos los campos son obligatorios.";
  }

  if (!canManageComplex(actor, idComplex)) {
    return new HttpError(403, FORBIDDEN_COMPLEX);
  }

  return (
    validarTextos({ nombre: nameCourt }) ??
    positiveIntegerError(hourlyPrice, PRICE_ERROR) ??
    positiveIntegerError(capacityPlayers, CAPACITY_ERROR)
  );
});

export const validateUpdateCourt = validate(({ body = {} }) => {
  const { typeCourt, nameCourt, hourlyPrice, capacityPlayers, idComplex } = body;

  if (
    typeCourt === undefined && nameCourt === undefined && hourlyPrice === undefined &&
    capacityPlayers === undefined && idComplex === undefined
  ) {
    return "No se envió ningún campo para actualizar.";
  }

  if (hourlyPrice !== undefined && positiveIntegerError(hourlyPrice, PRICE_ERROR)) return PRICE_ERROR;
  if (capacityPlayers !== undefined && positiveIntegerError(capacityPlayers, CAPACITY_ERROR)) return CAPACITY_ERROR;
  return null;
});
