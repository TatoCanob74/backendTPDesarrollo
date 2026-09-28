import { Court } from "../models/court.js";
import { Horary } from "../models/horary.js";
import { Location } from "../models/location.js";
import { Complex } from "../models/complex.js";
import { sendError } from "../utils/httpError.js";
import { validarTextos } from "../utils/validators.js";
import { hasFullAccess, canManageComplex, FORBIDDEN_COMPLEX } from "../utils/complexScope.js";

// La cancha ya no conoce su localidad directamente: la hereda del complejo
export const COMPLEX_WITH_LOCATION = {
  model: Complex,
  attributes: ["idComplex", "nameComplex", "addressComplex", "idLocation"],
  include: [{ model: Location, attributes: ["idLocation", "nomLocation", "nameCountry"] }]
};

export const seeCourtsWithHoraries = async (req, res) => {
  try {
    const filters = { stateCourt: 'DISPONIBLE' };
    if (req.query.typeCourt) {
      filters.typeCourt = req.query.typeCourt;
    }
    if (req.query.idComplex) {
      filters.idComplex = req.query.idComplex;
    }

    // Filtrar por localidad es filtrar por la localidad del complejo
    const complexInclude = { ...COMPLEX_WITH_LOCATION };
    if (req.query.idLocation) {
      complexInclude.where = { idLocation: req.query.idLocation };
    }

    const courts = await Court.findAll({
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

    res.status(200).json(courts);
  } catch (error) {
    sendError(res, error);
  }
};

export const createCourt = async (req, res) => {
  try {
    const { typeCourt, nameCourt, hourlyPrice, capacityPlayers } = req.body;

    // El admin crea canchas solo en su complejo, así que no hace falta que lo mande;
    // el superadmin tiene que decir en cuál
    const idComplex = hasFullAccess(req) ? req.body.idComplex : (req.body.idComplex ?? req.adminComplexId);

    if (!typeCourt || !nameCourt || !hourlyPrice || !capacityPlayers || !idComplex) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    if (!canManageComplex(req, idComplex)) {
      return res.status(403).json({ error: FORBIDDEN_COMPLEX });
    }

    const errorTexto = validarTextos({ nombre: nameCourt });
    if (errorTexto) {
      return res.status(400).json({ error: errorTexto });
    }

    if (!Number.isInteger(Number(hourlyPrice)) || Number(hourlyPrice) <= 0) {
      return res.status(400).json({ error: "El precio por hora debe ser un número entero mayor a 0." });
    }

    if (!Number.isInteger(Number(capacityPlayers)) || Number(capacityPlayers) <= 0) {
      return res.status(400).json({ error: "La capacidad de jugadores debe ser un número entero mayor a 0." });
    }

    const complex = await Complex.findByPk(idComplex);
    if (!complex) {
      return res.status(404).json({ error: "El complejo indicado no existe." });
    }

    const newCourt = await Court.create({
      typeCourt,
      nameCourt: String(nameCourt).trim(),
      hourlyPrice,
      capacityPlayers,
      idComplex,
      stateCourt: "DISPONIBLE"
    });

    res.status(201).json(newCourt);
  } catch (error) {
    sendError(res, error);
  }
};

export const updateCourt = async (req, res) => {
  try {
    const { id } = req.params;
    const { typeCourt, nameCourt, hourlyPrice, capacityPlayers, idComplex } = req.body;

    if (
      typeCourt === undefined && nameCourt === undefined && hourlyPrice === undefined &&
      capacityPlayers === undefined && idComplex === undefined
    ) {
      return res.status(400).json({ error: "No se envió ningún campo para actualizar." });
    }

    const court = await Court.findByPk(id);
    if (!court) {
      return res.status(404).json({ error: "Cancha no encontrada." });
    }

    if (!canManageComplex(req, court.idComplex)) {
      return res.status(403).json({ error: FORBIDDEN_COMPLEX });
    }

    if (hourlyPrice !== undefined && (!Number.isInteger(Number(hourlyPrice)) || Number(hourlyPrice) <= 0)) {
      return res.status(400).json({ error: "El precio por hora debe ser un número entero mayor a 0." });
    }

    if (capacityPlayers !== undefined && (!Number.isInteger(Number(capacityPlayers)) || Number(capacityPlayers) <= 0)) {
      return res.status(400).json({ error: "La capacidad de jugadores debe ser un número entero mayor a 0." });
    }

    // Mover una cancha de complejo es una decisión de la plataforma, no de un complejo
    if (idComplex !== undefined && Number(idComplex) !== court.idComplex) {
      if (!hasFullAccess(req)) {
        return res.status(403).json({ error: "Solo el superadministrador puede mover una cancha a otro complejo." });
      }
      const complex = await Complex.findByPk(idComplex);
      if (!complex) {
        return res.status(404).json({ error: "El complejo indicado no existe." });
      }
    }

    await court.update({ typeCourt, nameCourt, hourlyPrice, capacityPlayers, idComplex });

    res.status(200).json({ message: "Cancha actualizada exitosamente.", court });
  } catch (error) {
    sendError(res, error);
  }
};

export const updateCourtState = async (req, res) => {
  try {
    const { id } = req.params;

    const court = await Court.findByPk(id);
    if (!court) {
      return res.status(404).json({ error: "Cancha no encontrada." });
    }

    if (!canManageComplex(req, court.idComplex)) {
      return res.status(403).json({ error: FORBIDDEN_COMPLEX });
    }

    const newState = court.stateCourt === "DISPONIBLE" ? "OCUPADO" : "DISPONIBLE";
    await court.update({ stateCourt: newState });

    res.status(200).json({ message: `Cancha ahora está ${newState}.` });
  } catch (error) {
    sendError(res, error);
  }
};

export const deleteCourt = async (req, res) => {
  try {
    const { id } = req.params;

    const court = await Court.findByPk(id);
    if (!court) {
      return res.status(404).json({ error: "Cancha no encontrada." });
    }

    if (!canManageComplex(req, court.idComplex)) {
      return res.status(403).json({ error: FORBIDDEN_COMPLEX });
    }

    // La FK de Horarios está en ON DELETE CASCADE: borrar la cancha arrastraría sus reservas
    const horariosDeLaCancha = await Horary.count({ where: { idCourt: id } });
    if (horariosDeLaCancha > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: la cancha tiene ${horariosDeLaCancha} horario(s) configurado(s). ` +
          "Eliminá primero sus horarios, o deshabilitala si solo querés sacarla de circulación."
      });
    }

    await court.destroy();
    res.status(200).json({ message: "Cancha eliminada exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};