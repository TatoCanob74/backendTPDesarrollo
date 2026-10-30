import { sendError } from "../utils/httpError.js";
import { actorFrom } from "../utils/complexScope.js";
import * as usuarioService from "../services/usuario.service.js";
import { listReservesForAdmin } from "../services/reserve.service.js";
import { listCourtsForAdmin } from "../services/cancha.service.js";

export const seeUsers = async (req, res) => {
  try {
    const users = await usuarioService.listClients();
    res.status(200).json(users);
  } catch (error) {
    sendError(res, error);
  }
};

export const seeReserves = async (req, res) => {
  try {
    const reserves = await listReservesForAdmin(req.query, actorFrom(req));
    res.status(200).json(reserves);
  } catch (error) {
    sendError(res, error);
  }
};

export const seeCourts = async (req, res) => {
  try {
    const courts = await listCourtsForAdmin(req.query, actorFrom(req));
    res.status(200).json(courts);
  } catch (error) {
    sendError(res, error);
  }
};

export const updateUserState = async (req, res) => {
  try {
    const newState = await usuarioService.toggleUserState(req.params.id);
    res.status(200).json({ message: `Usuario ${newState} exitosamente.` });
  } catch (error) {
    sendError(res, error);
  }
};

export const deleteUser = async (req, res) => {
  try {
    await usuarioService.deleteUser(req.params.id);
    res.status(200).json({ message: "Usuario eliminado exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /admins (superadmin) — los administradores de complejo, con el complejo que tienen asignado
export const seeAdmins = async (req, res) => {
  try {
    const admins = await usuarioService.listAdmins();
    res.status(200).json(admins);
  } catch (error) {
    sendError(res, error);
  }
};

// POST /admins (superadmin) — da de alta un administrador de complejo
export const createAdmin = async (req, res) => {
  try {
    const newAdmin = await usuarioService.createAdmin(req.body);
    res.status(201).json(newAdmin);
  } catch (error) {
    sendError(res, error);
  }
};
