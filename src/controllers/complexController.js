import { Complex } from "../models/complex.js";
import { Location } from "../models/location.js";
import { Court } from "../models/court.js";
import { User } from "../models/user.js";
import { sendError } from "../utils/httpError.js";
import { validarTextos } from "../utils/validators.js";
import { hasFullAccess, canManageComplex, FORBIDDEN_COMPLEX } from "../utils/complexScope.js";

const LOCATION_ATTRIBUTES = ["idLocation", "nomLocation", "nameCountry"];
const ADMIN_ATTRIBUTES = ["idUser", "nameUser", "surnameUser", "emailUser"];

// Chequea que idAdmin sea un usuario ADMIN que todavía no administra otro complejo.
// Devuelve { status, error } si algo no cierra, o null si se puede asignar.
const validateAdminAssignment = async (idAdmin, idComplexActual = null) => {
  const admin = await User.findByPk(idAdmin);
  if (!admin) {
    return { status: 404, error: "El usuario indicado como administrador no existe." };
  }
  if (admin.typeUser !== "ADMIN") {
    return { status: 400, error: "El usuario indicado no tiene rol ADMIN." };
  }

  const otroComplejo = await Complex.findOne({ where: { idAdmin } });
  if (otroComplejo && otroComplejo.idComplex !== idComplexActual) {
    return { status: 409, error: `Ese administrador ya tiene asignado el complejo "${otroComplejo.nameComplex}".` };
  }
  return null;
};

// GET /complejos (público) — filtro opcional ?idLocation=
export const seeComplexes = async (req, res) => {
  try {
    const filters = {};
    if (req.query.idLocation) {
      filters.idLocation = req.query.idLocation;
    }

    const complexes = await Complex.findAll({
      where: filters,
      attributes: { exclude: ["idAdmin"] },
      include: [{ model: Location, attributes: LOCATION_ATTRIBUTES }],
      order: [["nameComplex", "ASC"]]
    });

    res.status(200).json(complexes);
  } catch (error) {
    sendError(res, error);
  }
};

// GET /complejos/:id (público) — el complejo con su localidad y sus canchas
export const seeComplexById = async (req, res) => {
  try {
    const complex = await Complex.findByPk(req.params.id, {
      attributes: { exclude: ["idAdmin"] },
      include: [
        { model: Location, attributes: LOCATION_ATTRIBUTES },
        { model: Court }
      ]
    });

    if (!complex) {
      return res.status(404).json({ error: "Complejo no encontrado." });
    }

    res.status(200).json(complex);
  } catch (error) {
    sendError(res, error);
  }
};

// GET /mi-complejo (admin) — el complejo que administra el usuario logueado
export const seeMyComplex = async (req, res) => {
  try {
    const complex = await Complex.findOne({
      where: { idAdmin: req.user.idUser },
      include: [
        { model: Location, attributes: LOCATION_ATTRIBUTES },
        { model: Court }
      ]
    });

    if (!complex) {
      return res.status(404).json({ error: "No tenés un complejo asignado." });
    }

    res.status(200).json(complex);
  } catch (error) {
    sendError(res, error);
  }
};

// POST /complejos (superadmin)
export const createComplex = async (req, res) => {
  try {
    const { nameComplex, addressComplex, idLocation, idAdmin } = req.body;

    if (!nameComplex || !addressComplex || !idLocation) {
      return res.status(400).json({ error: "El nombre, la dirección y la localidad son obligatorios." });
    }

    const errorTexto = validarTextos({ nombre: nameComplex, dirección: addressComplex });
    if (errorTexto) {
      return res.status(400).json({ error: errorTexto });
    }

    const location = await Location.findByPk(idLocation);
    if (!location) {
      return res.status(404).json({ error: "La localidad indicada no existe." });
    }

    if (idAdmin !== undefined && idAdmin !== null) {
      const adminError = await validateAdminAssignment(idAdmin);
      if (adminError) {
        return res.status(adminError.status).json({ error: adminError.error });
      }
    }

    const newComplex = await Complex.create({
      nameComplex: nameComplex.trim(),
      addressComplex: addressComplex.trim(),
      idLocation,
      idAdmin: idAdmin ?? null
    });

    res.status(201).json(newComplex);
  } catch (error) {
    sendError(res, error);
  }
};

// PUT /complejos/:id — el superadmin cambia cualquier campo; el admin del complejo
// solo puede editar el nombre y la dirección del suyo
export const updateComplex = async (req, res) => {
  try {
    const { id } = req.params;
    const { nameComplex, addressComplex, idLocation, idAdmin } = req.body;

    if (
      nameComplex === undefined && addressComplex === undefined &&
      idLocation === undefined && idAdmin === undefined
    ) {
      return res.status(400).json({ error: "No se envió ningún campo para actualizar." });
    }

    const complex = await Complex.findByPk(id);
    if (!complex) {
      return res.status(404).json({ error: "Complejo no encontrado." });
    }

    if (!canManageComplex(req, complex.idComplex)) {
      return res.status(403).json({ error: FORBIDDEN_COMPLEX });
    }

    if (!hasFullAccess(req) && (idLocation !== undefined || idAdmin !== undefined)) {
      return res.status(403).json({ error: "Solo el superadministrador puede cambiar la localidad o el administrador de un complejo." });
    }

    const textos = {};
    if (nameComplex !== undefined) textos.nombre = nameComplex;
    if (addressComplex !== undefined) textos.dirección = addressComplex;
    const errorTexto = validarTextos(textos);
    if (errorTexto) {
      return res.status(400).json({ error: errorTexto });
    }

    if (idLocation !== undefined) {
      const location = await Location.findByPk(idLocation);
      if (!location) {
        return res.status(404).json({ error: "La localidad indicada no existe." });
      }
    }

    // idAdmin: null desasigna al administrador actual
    if (idAdmin !== undefined && idAdmin !== null) {
      const adminError = await validateAdminAssignment(idAdmin, complex.idComplex);
      if (adminError) {
        return res.status(adminError.status).json({ error: adminError.error });
      }
    }

    await complex.update({
      nameComplex: nameComplex?.trim(),
      addressComplex: addressComplex?.trim(),
      idLocation,
      idAdmin
    });

    res.status(200).json({ message: "Complejo actualizado exitosamente.", complex });
  } catch (error) {
    sendError(res, error);
  }
};

// DELETE /complejos/:id (superadmin)
export const deleteComplex = async (req, res) => {
  try {
    const { id } = req.params;

    const complex = await Complex.findByPk(id);
    if (!complex) {
      return res.status(404).json({ error: "Complejo no encontrado." });
    }

    const canchasDelComplejo = await Court.count({ where: { idComplex: id } });
    if (canchasDelComplejo > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: el complejo tiene ${canchasDelComplejo} cancha(s). Eliminalas o movelas a otro complejo primero.`
      });
    }

    await complex.destroy();
    res.status(200).json({ message: "Complejo eliminado exitosamente." });
  } catch (error) {
    sendError(res, error);
  }
};
