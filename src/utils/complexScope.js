// Autorización por pertenencia: el rol dice QUÉ puede hacer un usuario, esto dice SOBRE QUÉ.
// Todas las funciones asumen que antes corrió el middleware loadAdminComplex.

export const hasFullAccess = (req) => req.user.typeUser === "SUPERADMIN";

// true si el usuario puede operar sobre un recurso que pertenece al complejo idComplex
export const canManageComplex = (req, idComplex) =>
  hasFullAccess(req) || Number(idComplex) === Number(req.adminComplexId);

// Filtro para los listados: el superadmin ve todo, el admin solo lo de su complejo
export const complexFilter = (req) =>
  hasFullAccess(req) ? {} : { idComplex: req.adminComplexId };

export const FORBIDDEN_COMPLEX = "No tenés permiso sobre recursos de otro complejo.";
