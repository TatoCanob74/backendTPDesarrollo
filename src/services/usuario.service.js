import bcrypt from "bcryptjs";
import sequelize from "../config/database.js";
import { User } from "../models/user.js";
import { Complex } from "../models/complex.js";
import { Reserve } from "../models/reserve.js";
import { HttpError } from "../utils/httpError.js";

const EDITABLE_FIELDS = ["nameUser", "surnameUser", "dateUser", "aliasUser"];
const WITHOUT_PASSWORD = { exclude: ["passwordUser"] };

export const withoutPassword = (user) => {
  const { passwordUser: _hash, ...rest } = user.toJSON();
  return rest;
};

export const findUserByEmail = (emailUser) => User.findOne({ where: { emailUser } });

const findUserOrFail = async (idUser, options) => {
  const user = await User.findByPk(idUser, options);
  if (!user) {
    throw new HttpError(404, "Usuario no encontrado.");
  }
  return user;
};

export const getProfile = (idUser) => findUserOrFail(idUser, { attributes: WITHOUT_PASSWORD });

export const updateProfile = async (idUser, { nameUser, surnameUser, dateUser, aliasUser }) => {
  const user = await findUserOrFail(idUser);

  await user.update(
    { nameUser: nameUser.trim(), surnameUser: surnameUser.trim(), dateUser, aliasUser: aliasUser.trim() },
    { fields: EDITABLE_FIELDS }
  );

  return withoutPassword(user);
};

export const listClients = () =>
  User.findAll({
    where: { typeUser: "CLIENTE" },
    attributes: WITHOUT_PASSWORD
  });

// Activa o desactiva la cuenta y devuelve el estado nuevo
export const toggleUserState = async (idUser) => {
  const user = await findUserOrFail(idUser);

  if (user.typeUser === "SUPERADMIN") {
    throw new HttpError(403, "No se puede desactivar al superadministrador.");
  }

  const newState = user.stateUser === "ACTIVO" ? "INACTIVO" : "ACTIVO";
  await user.update({ stateUser: newState });
  return newState;
};

export const deleteUser = async (idUser) => {
  const user = await findUserOrFail(idUser);

  if (user.typeUser === "SUPERADMIN") {
    throw new HttpError(403, "No se puede eliminar al superadministrador.");
  }

  const complejoAdministrado = await Complex.findOne({ where: { idAdmin: idUser } });
  if (complejoAdministrado) {
    throw new HttpError(409, `No se puede eliminar: administra el complejo "${complejoAdministrado.nameComplex}". Desasignalo primero.`);
  }

  const reservasDelUsuario = await Reserve.count({ where: { idUser } });
  if (reservasDelUsuario > 0) {
    throw new HttpError(409, "No se puede eliminar: el usuario tiene reservas asociadas. Desactivalo en su lugar.");
  }

  await user.destroy();
};

// Los administradores de complejo, con el complejo que tienen asignado
export const listAdmins = () =>
  User.findAll({
    where: { typeUser: "ADMIN" },
    attributes: WITHOUT_PASSWORD,
    include: [{ model: Complex, as: "managedComplex", attributes: ["idComplex", "nameComplex"] }]
  });

// Es la única forma de crear un ADMIN: el registro público siempre crea CLIENTE.
// Si viene idComplex, se lo asigna en la misma transacción.
export const createAdmin = async ({ nameUser, surnameUser, emailUser, dateUser, passwordUser, aliasUser, idComplex }) => {
  if (await findUserByEmail(emailUser)) {
    throw new HttpError(400, "El mail ya está registrado.");
  }

  let complex = null;
  if (idComplex !== undefined && idComplex !== null) {
    complex = await Complex.findByPk(idComplex);
    if (!complex) {
      throw new HttpError(404, "El complejo indicado no existe.");
    }
    if (complex.idAdmin) {
      throw new HttpError(409, "Ese complejo ya tiene un administrador asignado.");
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

  return { ...withoutPassword(newAdmin), idComplex: complex?.idComplex ?? null };
};
