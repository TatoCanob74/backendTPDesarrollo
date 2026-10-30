import { validate } from "../validate.js";
import { validarTextos } from "../../utils/validators.js";
import { HttpError } from "../../utils/httpError.js";
import { actorFrom, hasFullAccess } from "../../utils/complexScope.js";

export const validateCreateComplex = validate(({ body = {} }) => {
  const { nameComplex, addressComplex, idLocation } = body;

  if (!nameComplex || !addressComplex || !idLocation) {
    return "El nombre, la dirección y la localidad son obligatorios.";
  }
  return validarTextos({ nombre: nameComplex, dirección: addressComplex });
});

// El superadmin cambia cualquier campo; el admin del complejo solo el nombre y la dirección del suyo
export const validateUpdateComplex = validate((req) => {
  const { nameComplex, addressComplex, idLocation, idAdmin } = req.body ?? {};

  if (
    nameComplex === undefined && addressComplex === undefined &&
    idLocation === undefined && idAdmin === undefined
  ) {
    return "No se envió ningún campo para actualizar.";
  }

  if (!hasFullAccess(actorFrom(req)) && (idLocation !== undefined || idAdmin !== undefined)) {
    return new HttpError(403, "Solo el superadministrador puede cambiar la localidad o el administrador de un complejo.");
  }

  const textos = {};
  if (nameComplex !== undefined) textos.nombre = nameComplex;
  if (addressComplex !== undefined) textos.dirección = addressComplex;
  return validarTextos(textos);
});
