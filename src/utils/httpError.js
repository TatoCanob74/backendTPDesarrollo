// Traduce un error de Sequelize al status HTTP que corresponde.
//
// Sin esto, cualquier validación que fallaba en el modelo (los notEmpty, un
// ENUM inválido, una FK rota) caía en el catch genérico y salía como 500. Un
// 500 significa "se rompió el servidor"; si los datos que mandó el cliente
// están mal, el status correcto es 400.
export const sendError = (res, error, fallback = "Error interno del servidor.") => {
  console.error(error);

  // Validaciones declaradas en el modelo (validate: { notEmpty, len, is... })
  if (error.name === "SequelizeValidationError") {
    return res.status(400).json({ error: error.errors.map((e) => e.message).join(" ") });
  }

  // Índices únicos violados (por ejemplo, dos horarios iguales para una cancha)
  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ error: "Ya existe un registro con esos datos." });
  }

  // FK inexistente o fila referenciada por otra tabla
  if (error.name === "SequelizeForeignKeyConstraintError") {
    return res.status(409).json({ error: "El dato está relacionado con otros registros." });
  }

  // Valor fuera de un ENUM o de rango: MySQL responde "Data truncated for
  // column ...", que no le sirve de nada al usuario.
  if (error.name === "SequelizeDatabaseError") {
    return res.status(400).json({ error: "Alguno de los valores enviados no es válido." });
  }

  return res.status(500).json({ error: fallback });
};

export default sendError;
