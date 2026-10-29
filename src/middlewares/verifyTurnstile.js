// src/middlewares/verifyTurnstile.js
import { TurnstileValidator } from "../services/turnstile.service.js";

const validator = new TurnstileValidator(process.env.SECRET_KEY_CLOUDEFLARE);

export const verifyTurnstile = (expectedAction) => async (req, res, next) => {
  const { turnstileToken } = req.body ?? {};

  try {
    const result = await validator.validate(turnstileToken, req.ip, {
      expectedAction,
      expectedHostname: process.env.HOST_CLOUDEFLARE,
    });

    if (result.success) return next();

    console.warn("Turnstile rechazado:", result.error);
  } catch (err) {
    console.error("Turnstile falló:", err.message);
  }

  return res.status(403).json({ error: "No pudimos verificar que no sos un robot. Intentá de nuevo." });
};