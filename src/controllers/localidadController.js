import { sendError } from "../utils/httpError.js";
import * as localidadService from "../services/localidad.service.js";

export const seeLocations = async (req, res) => {
  try {
    const locations = await localidadService.listLocations();
    res.status(200).json(locations);
  } catch (error) {
    sendError(res, error);
  }
};

export const createLocation = async (req, res) => {
  try {
    const newLocation = await localidadService.createLocation(req.body);
    res.status(201).json(newLocation);
  } catch (error) {
    sendError(res, error);
  }
};

export const updateLocation = async (req, res) => {
  try {
    const location = await localidadService.updateLocation(req.params.id, req.body);
    res.status(200).json({ message: "Localidad actualizada exitosamente.", location });
  } catch (error) {
    sendError(res, error);
  }
};

export const deleteLocation = async (req, res) => {
  try {
    await localidadService.deleteLocation(req.params.id);
    res.status(200).json({ message: "Localidad eliminada exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};
