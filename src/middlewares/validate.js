import { HttpError } from "../utils/httpError.js";

// Arma un middleware a partir de una regla: (req) => mensaje de error, HttpError o null.
// Si la regla encuentra un problema corta con 400 (o el status del HttpError) y el
// request nunca llega al controller.
export const validate = (rule, { status = 400, key = "error" } = {}) => (req, res, next) => {
  const result = rule(req);
  if (!result) return next();

  if (result instanceof HttpError) {
    return res.status(result.status).json({ [key]: result.message });
  }
  return res.status(status).json({ [key]: result });
};
