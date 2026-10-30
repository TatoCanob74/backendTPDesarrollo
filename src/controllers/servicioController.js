import { sendError } from "../utils/httpError.js";
import * as servicioService from "../services/servicio.service.js";

export const seeServices = async (req, res) => {
  try {
    const services = await servicioService.listServices();
    res.status(200).json(services);
  } catch (error) {
    sendError(res, error);
  }
};

export const createService = async (req, res) => {
  try {
    const newService = await servicioService.createService(req.body);
    res.status(201).json(newService);
  } catch (error) {
    sendError(res, error);
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await servicioService.updateService(req.params.id, req.body);
    res.status(200).json({ message: "Servicio actualizado exitosamente.", service });
  } catch (error) {
    sendError(res, error);
  }
};

export const deleteService = async (req, res) => {
  try {
    await servicioService.deleteService(req.params.id);
    res.status(200).json({ message: "Servicio eliminado exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};
