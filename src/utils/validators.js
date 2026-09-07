// Validaciones de entrada reutilizables por los controllers.
//
// Van ACÁ y no en el modelo porque los controllers normalizan con .trim() antes
// de guardar: si el número llega como 123, String(123).trim() lo convierte en
// "123" y el modelo ya no puede distinguirlo de un texto legítimo. La única
// forma de rechazarlo es mirar el tipo del dato crudo, antes de normalizarlo.

/** true si `value` es un texto con al menos un caracter no en blanco. */
export const esTextoValido = (value) =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Verifica que los campos indicados sean textos no vacíos.
 * Devuelve el mensaje de error, o null si está todo bien.
 *
 * @param {object} campos  { etiqueta: valor } — la etiqueta se usa en el mensaje
 */
export const validarTextos = (campos) => {
  for (const [etiqueta, valor] of Object.entries(campos)) {
    if (!esTextoValido(valor)) {
      return `El campo "${etiqueta}" debe ser un texto y no puede estar vacío.`;
    }
  }
  return null;
};
