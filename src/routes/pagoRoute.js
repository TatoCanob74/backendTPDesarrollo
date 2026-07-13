import { Router } from "express";
import { createPreference, webhook, confirmPayment, getPaymentStatus } from "../controllers/pagoController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const routePago = Router();

// Crea la preferencia y devuelve el link de checkout de MercadoPago
routePago.post('/reserves/:idReserve/pago', verifyToken, createPreference);

// Confirma el pago cuando el usuario vuelve del checkout (manda el payment_id de la URL)
routePago.post('/reserves/:idReserve/pago/confirmar', verifyToken, confirmPayment);

// Consulta el estado del pago de una reserva
routePago.get('/reserves/:idReserve/pago', verifyToken, getPaymentStatus);

// Notificaciones automáticas de MercadoPago (sin auth: las manda MercadoPago, no el usuario)
routePago.post('/pagos/webhook', webhook);

export default routePago;
