import { User } from "../models/user.js";
import { Reserve } from "../models/reserve.js";
import { Court } from "../models/court.js";
import { Location } from "../models/location.js";
import { Horary } from "../models/horary.js";
import { Complex } from "../models/complex.js";
import bcrypt from "bcryptjs";
import sequelize from "../config/database.js";
import { emailUser as findUserByEmail } from "../models/user.js";
import { sendError } from "../utils/httpError.js";
import { validateNewUser } from "../utils/userValidation.js";
import { complexFilter, hasFullAccess } from "../utils/complexScope.js";

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
    // El filtro por complejo va en el include: la reserva no tiene idComplex, lo tiene su cancha
    const reserves = await Reserve.findAll({
      where: filters,
      include: [{ model: Court, where: complexFilter(req) }, Horary]
    });
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
    // El superadmin puede además filtrar por un complejo puntual
    if (req.query.idComplex && hasFullAccess(req)) {
      filters.idComplex = req.query.idComplex;
    }

    const courts = await Court.findAll({
      where: { ...filters, ...complexFilter(req) },
      include: [
        {
          model: Complex,
          attributes: ["idComplex", "nameComplex", "addressComplex"],
          include: [{ model: Location, attributes: ["idLocation", "nomLocation", "nameCountry"] }]
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

    if (user.typeUser === "SUPERADMIN") {
      return res.status(403).json({ error: "No se puede desactivar al superadministrador." });
    }

    const newState = user.stateUser === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    await user.update({ stateUser: newState });

    res.status(200).json({ message: `Usuario ${newState} exitosamente.` });

  } catch (error) {
    sendError(res, error);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (user.typeUser === "SUPERADMIN") {
      return res.status(403).json({ error: "No se puede eliminar al superadministrador." });
    }

    const complejoAdministrado = await Complex.findOne({ where: { idAdmin: id } });
    if (complejoAdministrado) {
      return res.status(409).json({
        error: `No se puede eliminar: administra el complejo "${complejoAdministrado.nameComplex}". Desasignalo primero.`
      });
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

// GET /admins (superadmin) — los administradores de complejo, con el complejo que tienen asignado
export const seeAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { typeUser: "ADMIN" },
      attributes: { exclude: ["passwordUser"] },
      include: [{ model: Complex, as: "managedComplex", attributes: ["idComplex", "nameComplex"] }]
    });
    res.status(200).json(admins);
  } catch (error) {
    sendError(res, error);
  }
};

// POST /admins (superadmin) — da de alta un administrador de complejo.
// Es la única forma de crear un ADMIN: el registro público siempre crea CLIENTE.
// Si viene idComplex, se lo asigna en la misma transacción.
export const createAdmin = async (req, res) => {
  try {
    const { nameUser, surnameUser, emailUser, dateUser, passwordUser, aliasUser, idComplex, verifiedUser } = req.body;

    const validationError = validateNewUser(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (await findUserByEmail(emailUser)) {
      return res.status(400).json({ error: "El mail ya está registrado." });
    }

    let complex = null;
    if (idComplex !== undefined && idComplex !== null) {
      complex = await Complex.findByPk(idComplex);
      if (!complex) {
        return res.status(404).json({ error: "El complejo indicado no existe." });
      }
      if (complex.idAdmin) {
        return res.status(409).json({ error: "Ese complejo ya tiene un administrador asignado." });
      }
    }

    const passwordHash = await bcrypt.hash(passwordUser, 10);

    // Transacción: o se crean las dos cosas (usuario + asignación) o ninguna
    const newAdmin = await sequelize.transaction(async (transaction) => {
      const user = await User.create({
        nameUser: nameUser.trim(),
        surnameUser: surnameUser.trim(),
        emailUser,
        dateUser,
        typeUser: "ADMIN",
        passwordUser: passwordHash,
        aliasUser: aliasUser.trim(),
        stateUser: "ACTIVO",
        verifiedUser: true,
      }, { transaction });

      if (complex) {
        await complex.update({ idAdmin: user.idUser }, { transaction });
      }
      return user;
    });

    const { passwordUser: _hash, ...adminWithoutPassword } = newAdmin.toJSON();
    res.status(201).json({ ...adminWithoutPassword, idComplex: complex?.idComplex ?? null });
  } catch (error) {
    sendError(res, error);
  }
};
