import { Router } from "express";
import { createPreference, webhook, confirmPayment, getPaymentStatus, syncMyPayments } from "../controllers/pagoController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const routePago = Router();

// Crea la preferencia y devuelve el link de checkout de MercadoPago
routePago.post('/reserves/:idReserve/pago', verifyToken, (req, res, next) => {
  console.log("Ruta de pago alcanzada");
  next();
}, createPreference);

// Confirma el pago cuando el usuario vuelve del checkout (manda el payment_id de la URL)
routePago.post('/reserves/:idReserve/pago/confirmar', verifyToken, confirmPayment);

// Consulta el estado del pago de una reserva
routePago.get('/reserves/:idReserve/pago', verifyToken, getPaymentStatus);

// Pone al día las reservas pendientes del usuario contra MercadoPago.
// Lo usa "Mis reservas" para que un pago aprobado se vea aunque el webhook
// nunca haya llegado (por ejemplo, corriendo el backend en localhost).
routePago.post('/reservas/sincronizar-pagos', verifyToken, syncMyPayments);

// Notificaciones automáticas de MercadoPago (sin auth: las manda MercadoPago, no el usuario)
routePago.post('/pagos/webhook', webhook);

export default routePago;