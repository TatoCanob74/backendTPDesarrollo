import { Location } from "../models/localidad.js";
import { Court } from "../models/cancha.js";
import { sendError } from "../utils/httpError.js";
import { validarTextos } from "../utils/validators.js";

export const seeLocations = async (req, res) => {
  try {
    const locations = await Location.findAll();
    res.status(200).json(locations);
  } catch (error) {
    sendError(res, error);
  }
};

export const createLocation = async (req, res) => {
  try {
    const { nameCountry, nomLocation } = req.body;

    if (!nameCountry || !nomLocation) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    const errorTexto = validarTextos({ país: nameCountry, localidad: nomLocation });
    if (errorTexto) {
      return res.status(400).json({ error: errorTexto });
    }

    const newLocation = await Location.create({
      nameCountry: String(nameCountry).trim(),
      nomLocation: String(nomLocation).trim()
    });
    res.status(201).json(newLocation);
  } catch (error) {
    sendError(res, error);
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { nameCountry, nomLocation } = req.body;

    // Un PUT sin ningún campo respondía "actualizada exitosamente" sin cambiar
    // nada: Sequelize ignora los undefined. Mejor avisar que no vino nada.
    if (nameCountry === undefined && nomLocation === undefined) {
      return res.status(400).json({ error: "No se envió ningún campo para actualizar." });
    }

    const location = await Location.findByPk(id);
    if (!location) {
      return res.status(404).json({ error: "Localidad no encontrada." });
    }

    await location.update({ nameCountry, nomLocation });
    res.status(200).json({ message: "Localidad actualizada exitosamente.", location });
  } catch (error) {
    sendError(res, error);
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findByPk(id);
    if (!location) {
      return res.status(404).json({ error: "Localidad no encontrada." });
    }

    const canchasDeLaLocalidad = await Court.count({ where: { idLocateCourt: id } });
    if (canchasDeLaLocalidad > 0) {
      return res.status(409).json({ error: "No se puede eliminar: la localidad tiene canchas asociadas." });
    }

    await location.destroy();
    res.status(200).json({ message: "Localidad eliminada exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};