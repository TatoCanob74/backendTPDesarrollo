import { sendError } from "../utils/httpError.js";
import { actorFrom } from "../utils/complexScope.js";
import * as complexService from "../services/complex.service.js";

// GET /complejos (público) — filtro opcional ?idLocation=
export const seeComplexes = async (req, res) => {
  try {
    const complexes = await complexService.listComplexes(req.query.idLocation);
    res.status(200).json(complexes);
  } catch (error) {
    sendError(res, error);
  }
};

// GET /complejos/:id (público) — el complejo con su localidad y sus canchas
export const seeComplexById = async (req, res) => {
  try {
    const complex = await complexService.getComplexById(req.params.id);
    res.status(200).json(complex);
  } catch (error) {
    sendError(res, error);
  }
};

// GET /mi-complejo (admin) — el complejo que administra el usuario logueado
export const seeMyComplex = async (req, res) => {
  try {
    const complex = await complexService.getComplexOfAdmin(req.user.idUser);
    res.status(200).json(complex);
  } catch (error) {
    sendError(res, error);
  }
};

// POST /complejos (superadmin)
export const createComplex = async (req, res) => {
  try {
    const newComplex = await complexService.createComplex(req.body);
    res.status(201).json(newComplex);
  } catch (error) {
    sendError(res, error);
  }
};

// PUT /complejos/:id — el superadmin cambia cualquier campo; el admin del complejo
// solo puede editar el nombre y la dirección del suyo
export const updateComplex = async (req, res) => {
  try {
    const complex = await complexService.updateComplex(req.params.id, req.body, actorFrom(req));
    res.status(200).json({ message: "Complejo actualizado exitosamente.", complex });
  } catch (error) {
    sendError(res, error);
  }
};

// DELETE /complejos/:id (superadmin)
export const deleteComplex = async (req, res) => {
  try {
    await complexService.deleteComplex(req.params.id);
    res.status(200).json({ message: "Complejo eliminado exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};
