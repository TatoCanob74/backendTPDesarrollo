import { Complex } from "../models/complex.js";
import { Location } from "../models/location.js";
import { Court } from "../models/court.js";
import { User } from "../models/user.js";
import { HttpError } from "../utils/httpError.js";
import { canManageComplex, FORBIDDEN_COMPLEX } from "../utils/complexScope.js";

const LOCATION_ATTRIBUTES = ["idLocation", "nomLocation", "nameCountry"];

const ensureLocationExists = async (idLocation) => {
  const location = await Location.findByPk(idLocation);
  if (!location) {
    throw new HttpError(404, "La localidad indicada no existe.");
  }
};

// Chequea que idAdmin sea un usuario ADMIN que todavía no administra otro complejo
const ensureAdminAssignable = async (idAdmin, idComplexActual = null) => {
  const admin = await User.findByPk(idAdmin);
  if (!admin) {
    throw new HttpError(404, "El usuario indicado como administrador no existe.");
  }
  if (admin.typeUser !== "ADMIN") {
    throw new HttpError(400, "El usuario indicado no tiene rol ADMIN.");
  }

  const otroComplejo = await Complex.findOne({ where: { idAdmin } });
  if (otroComplejo && otroComplejo.idComplex !== idComplexActual) {
    throw new HttpError(409, `Ese administrador ya tiene asignado el complejo "${otroComplejo.nameComplex}".`);
  }
};

const findComplexOrFail = async (idComplex) => {
  const complex = await Complex.findByPk(idComplex);
  if (!complex) {
    throw new HttpError(404, "Complejo no encontrado.");
  }
  return complex;
};

// El id del complejo que administra el usuario, o null si no tiene ninguno asignado
export const findComplexIdOfAdmin = async (idUser) => {
  const complex = await Complex.findOne({
    where: { idAdmin: idUser },
    attributes: ["idComplex"]
  });
  return complex?.idComplex ?? null;
};

export const listComplexes = (idLocation) =>
  Complex.findAll({
    where: idLocation ? { idLocation } : {},
    attributes: { exclude: ["idAdmin"] },
    include: [{ model: Location, attributes: LOCATION_ATTRIBUTES }],
    order: [["nameComplex", "ASC"]]
  });

// El complejo con su localidad y sus canchas
export const getComplexById = async (idComplex) => {
  const complex = await Complex.findByPk(idComplex, {
    attributes: { exclude: ["idAdmin"] },
    include: [
      { model: Location, attributes: LOCATION_ATTRIBUTES },
      { model: Court }
    ]
  });

  if (!complex) {
    throw new HttpError(404, "Complejo no encontrado.");
  }
  return complex;
};

export const getComplexOfAdmin = async (idUser) => {
  const complex = await Complex.findOne({
    where: { idAdmin: idUser },
    include: [
      { model: Location, attributes: LOCATION_ATTRIBUTES },
      { model: Court }
    ]
  });

  if (!complex) {
    throw new HttpError(404, "No tenés un complejo asignado.");
  }
  return complex;
};

export const createComplex = async ({ nameComplex, addressComplex, idLocation, idAdmin }) => {
  await ensureLocationExists(idLocation);

  if (idAdmin !== undefined && idAdmin !== null) {
    await ensureAdminAssignable(idAdmin);
  }

  return Complex.create({
    nameComplex: nameComplex.trim(),
    addressComplex: addressComplex.trim(),
    idLocation,
    idAdmin: idAdmin ?? null
  });
};

export const updateComplex = async (idComplex, { nameComplex, addressComplex, idLocation, idAdmin }, actor) => {
  const complex = await findComplexOrFail(idComplex);

  if (!canManageComplex(actor, complex.idComplex)) {
    throw new HttpError(403, FORBIDDEN_COMPLEX);
  }

  if (idLocation !== undefined) {
    await ensureLocationExists(idLocation);
  }

  // idAdmin: null desasigna al administrador actual
  if (idAdmin !== undefined && idAdmin !== null) {
    await ensureAdminAssignable(idAdmin, complex.idComplex);
  }

  await complex.update({
    nameComplex: nameComplex?.trim(),
    addressComplex: addressComplex?.trim(),
    idLocation,
    idAdmin
  });
  return complex;
};

export const deleteComplex = async (idComplex) => {
  const complex = await findComplexOrFail(idComplex);

  const canchasDelComplejo = await Court.count({ where: { idComplex } });
  if (canchasDelComplejo > 0) {
    throw new HttpError(409,
      `No se puede eliminar: el complejo tiene ${canchasDelComplejo} cancha(s). Eliminalas o movelas a otro complejo primero.`
    );
  }

  await complex.destroy();
};
