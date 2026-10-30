import { Court } from "../models/court.js";
import { Horary } from "../models/horary.js";
import { Location } from "../models/location.js";
import { Complex } from "../models/complex.js";
import { HttpError } from "../utils/httpError.js";
import { hasFullAccess, canManageComplex, complexFilter, targetComplexId, FORBIDDEN_COMPLEX } from "../utils/complexScope.js";

// La cancha ya no conoce su localidad directamente: la hereda del complejo
export const COMPLEX_WITH_LOCATION = {
  model: Complex,
  attributes: ["idComplex", "nameComplex", "addressComplex", "idLocation"],
  include: [{ model: Location, attributes: ["idLocation", "nomLocation", "nameCountry"] }]
};

const ensureComplexExists = async (idComplex) => {
  const complex = await Complex.findByPk(idComplex);
  if (!complex) {
    throw new HttpError(404, "El complejo indicado no existe.");
  }
};

// Busca la cancha y verifica que el usuario pueda operar sobre su complejo
const findManageableCourt = async (idCourt, actor) => {
  const court = await Court.findByPk(idCourt);
  if (!court) {
    throw new HttpError(404, "Cancha no encontrada.");
  }

  if (!canManageComplex(actor, court.idComplex)) {
    throw new HttpError(403, FORBIDDEN_COMPLEX);
  }
  return court;
};

// Catálogo público: solo canchas disponibles, con sus horarios y su complejo
export const listAvailableCourts = ({ typeCourt, idComplex, idLocation }) => {
  const filters = { stateCourt: "DISPONIBLE" };
  if (typeCourt) filters.typeCourt = typeCourt;
  if (idComplex) filters.idComplex = idComplex;

  // Filtrar por localidad es filtrar por la localidad del complejo
  const complexInclude = { ...COMPLEX_WITH_LOCATION };
  if (idLocation) {
    complexInclude.where = { idLocation };
  }

  return Court.findAll({
    where: filters,
    include: [
      {
        model: Horary,
        as: "horaries",
        attributes: ["idHorary", "startTime", "endTime", "day"],
      },
      complexInclude
    ]
  });
};

export const listCourtsForAdmin = ({ typeCourt, stateCourt, idComplex }, actor) => {
  const filters = {};
  if (typeCourt) filters.typeCourt = typeCourt;
  if (stateCourt) filters.stateCourt = stateCourt;
  // El superadmin puede además filtrar por un complejo puntual
  if (idComplex && hasFullAccess(actor)) filters.idComplex = idComplex;

  return Court.findAll({
    where: { ...filters, ...complexFilter(actor) },
    include: [
      {
        model: Complex,
        attributes: ["idComplex", "nameComplex", "addressComplex"],
        include: [{ model: Location, attributes: ["idLocation", "nomLocation", "nameCountry"] }]
      }
    ]
  });
};

export const createCourt = async ({ typeCourt, nameCourt, hourlyPrice, capacityPlayers, idComplex }, actor) => {
  const complexOfCourt = targetComplexId(actor, idComplex);
  await ensureComplexExists(complexOfCourt);

  return Court.create({
    typeCourt,
    nameCourt: String(nameCourt).trim(),
    hourlyPrice,
    capacityPlayers,
    idComplex: complexOfCourt,
    stateCourt: "DISPONIBLE"
  });
};

export const updateCourt = async (idCourt, { typeCourt, nameCourt, hourlyPrice, capacityPlayers, idComplex }, actor) => {
  const court = await findManageableCourt(idCourt, actor);

  // Mover una cancha de complejo es una decisión de la plataforma, no de un complejo
  if (idComplex !== undefined && Number(idComplex) !== court.idComplex) {
    if (!hasFullAccess(actor)) {
      throw new HttpError(403, "Solo el superadministrador puede mover una cancha a otro complejo.");
    }
    await ensureComplexExists(idComplex);
  }

  await court.update({ typeCourt, nameCourt, hourlyPrice, capacityPlayers, idComplex });
  return court;
};

// Alterna entre DISPONIBLE y OCUPADO y devuelve el estado nuevo
export const toggleCourtState = async (idCourt, actor) => {
  const court = await findManageableCourt(idCourt, actor);

  const newState = court.stateCourt === "DISPONIBLE" ? "OCUPADO" : "DISPONIBLE";
  await court.update({ stateCourt: newState });
  return newState;
};

export const deleteCourt = async (idCourt, actor) => {
  const court = await findManageableCourt(idCourt, actor);

  // La FK de Horarios está en ON DELETE CASCADE: borrar la cancha arrastraría sus reservas
  const horariosDeLaCancha = await Horary.count({ where: { idCourt } });
  if (horariosDeLaCancha > 0) {
    throw new HttpError(409,
      `No se puede eliminar: la cancha tiene ${horariosDeLaCancha} horario(s) configurado(s). ` +
      "Eliminá primero sus horarios, o deshabilitala si solo querés sacarla de circulación."
    );
  }

  await court.destroy();
};
