import { Court } from "../models/cancha.js";
import { Horary } from "../models/Horario.js";
import { Location } from "../models/localidad.js";

export const seeCourtsWithHoraries = async (req, res) => {
  try {
    const filters = { stateCourt: 'DISPONIBLE' };
    if (req.query.typeCourt) {
      filters.typeCourt = req.query.typeCourt;
    }

    const courts = await Court.findAll({
      where: filters,
      include: [
        {
          model: Horary,
          as: "Horarios",
          attributes: ["idHorary", "startTime", "endTime", "day"],
        },
        {
          model: Location,
          attributes: ["idLocation", "nomLocation", "nameCountry"]
        }
      ]
    });

    res.status(200).json(courts);
  } catch (error) {
    res.status(500).json({ error: error.message || error });
  }
};

// POST /canchas — crear cancha nueva (admin)
export const createCourt = async (req, res) => {
  try {
    const { typeCourt, nameCourt, hourlyPrice, capacityPlayers, idLocateCourt } = req.body;

    if (!typeCourt || !nameCourt || !hourlyPrice || !capacityPlayers || !idLocateCourt) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    if (!Number.isInteger(Number(hourlyPrice)) || Number(hourlyPrice) <= 0) {
      return res.status(400).json({ error: "El precio por hora debe ser un número entero mayor a 0." });
    }

    if (!Number.isInteger(Number(capacityPlayers)) || Number(capacityPlayers) <= 0) {
      return res.status(400).json({ error: "La capacidad de jugadores debe ser un número entero mayor a 0." });
    }

    const location = await Location.findByPk(idLocateCourt);
    if (!location) {
      return res.status(404).json({ error: "La localidad indicada no existe." });
    }

    const newCourt = await Court.create({
      typeCourt,
      nameCourt,
      hourlyPrice,
      capacityPlayers,
      idLocateCourt,
      stateCourt: "DISPONIBLE"
    });

    res.status(201).json(newCourt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /canchas/:id — editar cancha (admin)
export const updateCourt = async (req, res) => {
  try {
    const { id } = req.params;
    const { typeCourt, nameCourt, hourlyPrice, capacityPlayers, idLocateCourt } = req.body;

    const court = await Court.findByPk(id);
    if (!court) {
      return res.status(404).json({ error: "Cancha no encontrada." });
    }

    if (hourlyPrice !== undefined && (!Number.isInteger(Number(hourlyPrice)) || Number(hourlyPrice) <= 0)) {
      return res.status(400).json({ error: "El precio por hora debe ser un número entero mayor a 0." });
    }

    if (capacityPlayers !== undefined && (!Number.isInteger(Number(capacityPlayers)) || Number(capacityPlayers) <= 0)) {
      return res.status(400).json({ error: "La capacidad de jugadores debe ser un número entero mayor a 0." });
    }

    if (idLocateCourt !== undefined) {
      const location = await Location.findByPk(idLocateCourt);
      if (!location) {
        return res.status(404).json({ error: "La localidad indicada no existe." });
      }
    }

    await court.update({ typeCourt, nameCourt, hourlyPrice, capacityPlayers, idLocateCourt });

    res.status(200).json({ message: "Cancha actualizada exitosamente.", court });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /canchas/:id/estado — habilitar/deshabilitar cancha (admin)
export const updateCourtState = async (req, res) => {
  try {
    const { id } = req.params;

    const court = await Court.findByPk(id);
    if (!court) {
      return res.status(404).json({ error: "Cancha no encontrada." });
    }

    const newState = court.stateCourt === "DISPONIBLE" ? "OCUPADO" : "DISPONIBLE";
    await court.update({ stateCourt: newState });

    res.status(200).json({ message: `Cancha ahora está ${newState}.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /canchas/:id — eliminar cancha (admin)
export const deleteCourt = async (req, res) => {
  try {
    const { id } = req.params;

    const court = await Court.findByPk(id);
    if (!court) {
      return res.status(404).json({ error: "Cancha no encontrada." });
    }

    // Los horarios NO son reservas: son las franjas configuradas para esta cancha.
    // Se bloquea el borrado porque la FK está en ON DELETE CASCADE y arrastraría
    // también las reservas de esos horarios.
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
    res.status(500).json({ error: error.message });
  }
};