import { User } from "../models/usuarios.js";
import { Reserve } from "../models/Reserva.js";
import { Court } from "../models/cancha.js";
import { Location } from "../models/localidad.js";
import { Horary } from "../models/Horario.js";
import { sendError } from "../utils/httpError.js";

export const seeUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        typeUser: "CLIENTE"
      },
      attributes: { exclude: ["passwordUser"] }
    });

    res.status(200).json(users);

  } catch(error) {
    sendError(res, error);
  };
};

const RESERVE_STATES = ["pendiente", "confirmada", "cancelada"];
const COURT_TYPES = ["FUTBOL", "TENIS", "PADEL"];
const COURT_STATES = ["DISPONIBLE", "OCUPADO"];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const seeReserves = async (req, res) => {
  try {
    const filters = {};
    if (req.query.stateReserva){
      // Un valor fuera del ENUM devolvía una lista vacía, como si simplemente
      // no hubiera reservas. Conviene avisar que el filtro está mal escrito.
      if (!RESERVE_STATES.includes(req.query.stateReserva)) {
        return res.status(400).json({
          error: `Estado inválido. Debe ser uno de: ${RESERVE_STATES.join(", ")}.`
        });
      }
      filters.stateReserva = req.query.stateReserva;
    }
    if (req.query.dateReserve){
      if (!DATE_REGEX.test(req.query.dateReserve)) {
        return res.status(400).json({ error: "Formato de fecha inválido. Usá AAAA-MM-DD." });
      }
      filters.dateReserve = req.query.dateReserve;
    }
    const reserves = await Reserve.findAll({
      where: filters,
      include: [Court, Horary]
    });
    // Un listado sin resultados NO es un error: es una lista vacía. Devolver
    // 404 acá obligaba al frontend a tratar el "no hay nada" como excepción.
    res.status(200).json(reserves);
  } catch(error) {
    sendError(res, error);
  }
};

export const seeCourts = async (req, res) => {
  try {
    const filters = {};
    if (req.query.typeCourt){
      if (!COURT_TYPES.includes(req.query.typeCourt)) {
        return res.status(400).json({
          error: `Tipo de cancha inválido. Debe ser uno de: ${COURT_TYPES.join(", ")}.`
        });
      }
      filters.typeCourt = req.query.typeCourt;
    }
    if (req.query.stateCourt){
      if (!COURT_STATES.includes(req.query.stateCourt)) {
        return res.status(400).json({
          error: `Estado de cancha inválido. Debe ser uno de: ${COURT_STATES.join(", ")}.`
        });
      }
      filters.stateCourt = req.query.stateCourt;
    }
    const courts = await Court.findAll({
      where: filters,
      include: [
        {
          model: Location,
          attributes: ["idLocation", "nomLocation", "nameCountry"]
        }
      ]
    });
    res.status(200).json(courts);
  } catch(error){
    sendError(res, error);
  }
};

export const updateUserState = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Si está ACTIVO lo desactiva, si está INACTIVO lo activa
    const newState = user.stateUser === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    await user.update({ stateUser: newState });

    res.status(200).json({ message: `Usuario ${newState} exitosamente.` });

  } catch (error) {
    sendError(res, error);
  }
};

// DELETE /admin/usuarios/:id — eliminar usuario (admin)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

     const reservasDelUsuario = await Reserve.count({ where: { idUser: id } });
      if (reservasDelUsuario > 0) {
        return res.status(409).json({
         error: "No se puede eliminar: el usuario tiene reservas asociadas. Desactivalo en su lugar."
      });
    }

    await user.destroy();
    res.status(200).json({ message: "Usuario eliminado exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};