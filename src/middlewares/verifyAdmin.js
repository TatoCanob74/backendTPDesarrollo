import { sendError } from "../utils/httpError.js";
import { findComplexIdOfAdmin } from "../services/complex.service.js";

// Se reexporta para que las rutas de admin sigan importando todo desde este archivo
export { verifyToken } from "./verifyToken.js";

const ADMIN_ROLES = ["ADMIN", "SUPERADMIN"];

// Deja pasar a los dos niveles de administración: el admin de un complejo y el superadmin
export const isAdmin = (req, res, next) => {
  if (!ADMIN_ROLES.includes(req.user.typeUser)) {
    return res.status(403).json({message: "Acceso denegado"});
  }
  next();
};

export const isSuperAdmin = (req, res, next) => {
  if (req.user.typeUser !== "SUPERADMIN") {
    return res.status(403).json({message: "Acceso denegado: solo el superadministrador puede hacer esto."});
  }
  next();
};

// Va después de isAdmin. Deja en req.adminComplexId el complejo que administra el usuario
// (null para el superadmin, que no está atado a ninguno). Se consulta en la base en cada
// request en vez de guardarlo en el JWT: si el superadmin reasigna el complejo, el cambio
// vale desde la próxima petición y no recién cuando expira el token.
export const loadAdminComplex = async (req, res, next) => {
  try {
    if (req.user.typeUser === "SUPERADMIN") {
      req.adminComplexId = null;
      return next();
    }

    const idComplex = await findComplexIdOfAdmin(req.user.idUser);

    if (!idComplex) {
      return res.status(403).json({ message: "No tenés un complejo asignado. Pedile al superadministrador que te asigne uno." });
    }

    req.adminComplexId = idComplex;
    next();
  } catch (error) {
    sendError(res, error);
  }
};
