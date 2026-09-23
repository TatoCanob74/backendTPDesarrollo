export const sendError = (res, error, fallback = "Error interno del servidor.") => {
  console.error(error);

  if (error.name === "SequelizeValidationError") {
    return res.status(400).json({ error: error.errors.map((e) => e.message).join(" ") });
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ error: "Ya existe un registro con esos datos." });
  }

  if (error.name === "SequelizeForeignKeyConstraintError") {
    return res.status(409).json({ error: "El dato está relacionado con otros registros." });
  }

  if (error.name === "SequelizeDatabaseError") {
    return res.status(400).json({ error: "Alguno de los valores enviados no es válido." });
  }

  return res.status(500).json({ error: fallback });
};

export default sendError;
