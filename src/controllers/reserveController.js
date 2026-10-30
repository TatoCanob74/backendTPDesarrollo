import { sendError } from "../utils/httpError.js";
import { actorFrom } from "../utils/complexScope.js";
import * as reserveService from "../services/reserve.service.js";

export const createReserve = async (req, res) => {
  try {
    const { typeCourt, dateReserve, day, idHorary, services } = req.body;
    const idLocation = req.body.idLocation ?? req.body.idLocateCourt;

    const reserve = await reserveService.createReserve(
      { typeCourt, idLocation, dateReserve, day, idHorary, services },
      req.user.idUser
    );

    res.status(201).json({
      message: "Reserva creada exitosamente.",
      reserve
    });
  } catch (error) {
    sendError(res, error);
  }
};

export const cancelReserve = async (req, res) => {
  try {
    await reserveService.cancelReserve(req.params.id, req.user.idUser);
    res.status(200).json({ message: "Reserva cancelada exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};

export const seeMyReserves = async (req, res) => {
  try {
    const reserves = await reserveService.listUserReserves(req.user.idUser, req.query.stateReserva);
    res.status(200).json(reserves);
  } catch (error) {
    sendError(res, error);
  }
};

// Detalle de una reserva: la ve su dueño, el admin del complejo de la cancha y el superadmin
export const seeReserveById = async (req, res) => {
  try {
    const reserve = await reserveService.getReserveById(req.params.id, req.user);
    res.status(200).json(reserve);
  } catch (error) {
    sendError(res, error);
  }
};

export const updateReserveState = async (req, res) => {
  try {
    const { stateReserva } = req.body;
    await reserveService.updateReserveState(req.params.id, stateReserva, actorFrom(req));
    res.status(200).json({ message: `Reserva actualizada a estado ${stateReserva}.` });
  } catch (error) {
    sendError(res, error);
  }
};

export const deleteReserve = async (req, res) => {
  try {
    await reserveService.deleteReserve(req.params.id, actorFrom(req));
    res.status(200).json({ message: "Reserva eliminada exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};
