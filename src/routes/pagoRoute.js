import { Router } from "express";
import { createPreference, webhook, confirmPayment, getPaymentStatus, syncMyPayments } from "../controllers/pagoController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { validatePaymentMethod, validateConfirmPayment } from "../middlewares/validations/pagoValidation.js";

const routePago = Router();

routePago.post('/reserves/:idReserve/pago', verifyToken, validatePaymentMethod, createPreference);

routePago.post('/reserves/:idReserve/pago/confirmar', verifyToken, validateConfirmPayment, confirmPayment);

routePago.get('/reserves/:idReserve/pago', verifyToken, getPaymentStatus);

routePago.post('/reservas/sincronizar-pagos', verifyToken, syncMyPayments);

// Sin auth: la notificación la manda MercadoPago, no el usuario
routePago.post('/pagos/webhook', webhook);

export default routePago;
