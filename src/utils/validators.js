// El .trim() de los controllers convierte 123 en "123": el tipo hay que mirarlo acá, no en el modelo
export const esTextoValido = (value) =>
  typeof value === "string" && value.trim().length > 0;

export const validarTextos = (campos) => {
  for (const [etiqueta, valor] of Object.entries(campos)) {
    if (!esTextoValido(valor)) {
      return `El campo "${etiqueta}" debe ser un texto y no puede estar vacío.`;
    }
  }
  return null;
};
