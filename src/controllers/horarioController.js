import { sendError } from "../utils/httpError.js";
import { actorFrom } from "../utils/complexScope.js";
import * as horarioService from "../services/horario.service.js";

export const seeHoraries = async (req, res) => {
  try {
    const horaries = await horarioService.listHoraries(req.query);
    res.status(200).json(horaries);
  } catch (error) {
    sendError(res, error);
  }
};

export const createHorary = async (req, res) => {
  try {
    const newHorary = await horarioService.createHorary(req.body, actorFrom(req));
    res.status(201).json(newHorary);
  } catch (error) {
    sendError(res, error);
  }
};

export const updateHorary = async (req, res) => {
  try {
    const horary = await horarioService.updateHorary(req.params.id, req.body, actorFrom(req));
    res.status(200).json({ message: "Horario actualizado exitosamente.", horary });
  } catch (error) {
    sendError(res, error);
  }
};

export const deleteHorary = async (req, res) => {
  try {
    await horarioService.deleteHorary(req.params.id, actorFrom(req));
    res.status(200).json({ message: "Horario eliminado exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};
