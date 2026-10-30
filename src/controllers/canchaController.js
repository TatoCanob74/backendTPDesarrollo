import { sendError } from "../utils/httpError.js";
import { actorFrom } from "../utils/complexScope.js";
import * as canchaService from "../services/cancha.service.js";

export const seeCourtsWithHoraries = async (req, res) => {
  try {
    const courts = await canchaService.listAvailableCourts(req.query);
    res.status(200).json(courts);
  } catch (error) {
    sendError(res, error);
  }
};

export const createCourt = async (req, res) => {
  try {
    const newCourt = await canchaService.createCourt(req.body, actorFrom(req));
    res.status(201).json(newCourt);
  } catch (error) {
    sendError(res, error);
  }
};

export const updateCourt = async (req, res) => {
  try {
    const court = await canchaService.updateCourt(req.params.id, req.body, actorFrom(req));
    res.status(200).json({ message: "Cancha actualizada exitosamente.", court });
  } catch (error) {
    sendError(res, error);
  }
};

export const updateCourtState = async (req, res) => {
  try {
    const newState = await canchaService.toggleCourtState(req.params.id, actorFrom(req));
    res.status(200).json({ message: `Cancha ahora está ${newState}.` });
  } catch (error) {
    sendError(res, error);
  }
};

export const deleteCourt = async (req, res) => {
  try {
    await canchaService.deleteCourt(req.params.id, actorFrom(req));
    res.status(200).json({ message: "Cancha eliminada exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};
