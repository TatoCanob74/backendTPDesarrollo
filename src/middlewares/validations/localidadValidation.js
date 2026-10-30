import { validate } from "../validate.js";
import { validarTextos } from "../../utils/validators.js";

export const validateCreateLocation = validate(({ body = {} }) => {
  const { nameCountry, nomLocation } = body;

  if (!nameCountry || !nomLocation) {
    return "Todos los campos son obligatorios.";
  }
  return validarTextos({ país: nameCountry, localidad: nomLocation });
});

export const validateUpdateLocation = validate(({ body = {} }) => {
  const { nameCountry, nomLocation } = body;

  if (nameCountry === undefined && nomLocation === undefined) {
    return "No se envió ningún campo para actualizar.";
  }

  // Mismas reglas que el alta, pero solo para los campos que vinieron (edición parcial)
  const textos = {};
  if (nameCountry !== undefined) textos.país = nameCountry;
  if (nomLocation !== undefined) textos.localidad = nomLocation;
  return validarTextos(textos);
});
