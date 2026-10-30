// Autorización por pertenencia: el rol dice QUÉ puede hacer un usuario, esto dice SOBRE QUÉ.
// Todas las funciones asumen que antes corrió el middleware loadAdminComplex.

// Quién hace el pedido, sin el resto del req: así los servicios no dependen de Express
export const actorFrom = (req) => ({
  idUser: req.user.idUser,
  typeUser: req.user.typeUser,
  adminComplexId: req.adminComplexId
});

export const hasFullAccess = (actor) => actor.typeUser === "SUPERADMIN";

// true si el usuario puede operar sobre un recurso que pertenece al complejo idComplex
export const canManageComplex = (actor, idComplex) =>
  hasFullAccess(actor) || Number(idComplex) === Number(actor.adminComplexId);

// Filtro para los listados: el superadmin ve todo, el admin solo lo de su complejo
export const complexFilter = (actor) =>
  hasFullAccess(actor) ? {} : { idComplex: actor.adminComplexId };

// El admin crea canchas solo en su complejo, así que no hace falta que lo mande;
// el superadmin tiene que decir en cuál
export const targetComplexId = (actor, idComplex) =>
  hasFullAccess(actor) ? idComplex : (idComplex ?? actor.adminComplexId);

export const FORBIDDEN_COMPLEX = "No tenés permiso sobre recursos de otro complejo.";
