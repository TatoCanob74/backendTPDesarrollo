import TurnstileValidator from "../services/turnstile.service.js";

export const verifyTurnstile = (expectedAction) => async (req, res, next) => {
  const { turnstileToken } = req.body ?? {};

  const secretKey = process.env.SECRET_KEY_CLOUDEFLARE;
  const expectedHostname = process.env.HOST_CLOUDEFLARE;

  if (!secretKey) {
    console.error("Error crítico: SECRET_KEY_CLOUDEFLARE no está definida en las variables de entorno.");
    return res.status(500).json({ error: "Error de configuración en el servidor." });
  }

  const validator = new TurnstileValidator(secretKey);

  try {
    const result = await validator.validate(turnstileToken, req.ip, {
      expectedAction,
      expectedHostname,
    });

    if (result.success) {
      return next();
    }

    // Muestra los detalles reales retornados por Cloudflare o tus validaciones personalizadas
    console.warn("Turnstile rechazado:", {
      errorCodes: result["error-codes"],
      customError: result.error,
      expectedAction,
      receivedAction: result.action,
      expectedHostname,
      receivedHostname: result.hostname,
    });
  } catch (err) {
    console.error("Turnstile falló inesperadamente:", err.message);
  }

  return res.status(401).json({ error: "No pudimos verificar que no sos un robot. Intentá de nuevo." });
};