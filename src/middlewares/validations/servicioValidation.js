import { validate } from "../validate.js";
import { validarTextos } from "../../utils/validators.js";

const priceError = (priceService) =>
  !Number.isInteger(Number(priceService)) || Number(priceService) <= 0
    ? "El precio del servicio debe ser un número entero mayor a 0."
    : null;

export const validateCreateService = validate(({ body = {} }) => {
  const { nameService, priceService, descriptionService } = body;

  if (!nameService || !priceService || !descriptionService) {
    return "Todos los campos son obligatorios.";
  }

  return validarTextos({ nombre: nameService, descripción: descriptionService }) ?? priceError(priceService);
});

export const validateUpdateService = validate(({ body = {} }) => {
  const { nameService, priceService, descriptionService } = body;

  if (nameService === undefined && priceService === undefined && descriptionService === undefined) {
    return "No se envió ningún campo para actualizar.";
  }

  // Mismas reglas que el alta, pero solo para los campos que vinieron (edición parcial)
  const textos = {};
  if (nameService !== undefined) textos.nombre = nameService;
  if (descriptionService !== undefined) textos.descripción = descriptionService;
  const errorTexto = validarTextos(textos);
  if (errorTexto) return errorTexto;

  return priceService !== undefined ? priceError(priceService) : null;
});
