import { validate } from "../validate.js";
import { PAYMENT_METHODS } from "../../services/pago.service.js";

// Los endpoints de pago responden { message }: así lo lee el frontend
export const validatePaymentMethod = validate(
  ({ body }) => {
    const paymentMethod = body?.metodo ?? "MERCADO_PAGO";
    return PAYMENT_METHODS.includes(paymentMethod)
      ? null
      : `Forma de pago inválida. Debe ser una de: ${PAYMENT_METHODS.join(", ")}.`;
  },
  { key: "message" }
);

export const validateConfirmPayment = validate(
  ({ body }) => (body?.payment_id ? null : "Falta el payment_id"),
  { key: "message" }
);
