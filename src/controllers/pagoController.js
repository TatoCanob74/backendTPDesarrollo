import { HttpError, sendError } from "../utils/httpError.js";
import { actorFrom } from "../utils/complexScope.js";
import * as pagoService from "../services/pago.service.js";

// Los endpoints de pago responden { message } (así lo lee el frontend) y, si se rompe
// algo inesperado, agregan el detalle en `error`
const sendPaymentError = (res, error, fallback) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  return res.status(500).json({ message: fallback, error: error.message });
};

export const createPreference = async (req, res) => {
  try {
    const paymentMethod = req.body?.metodo ?? "MERCADO_PAGO";
    const preference = await pagoService.createPreference(req.params.idReserve, req.user.idUser, paymentMethod);
    res.json(preference);
  } catch (error) {
    sendPaymentError(res, error, "Error al crear la preferencia de pago");
  }
};

export const syncMyPayments = async (req, res) => {
  try {
    const result = await pagoService.syncUserPayments(req.user.idUser);
    res.json(result);
  } catch (error) {
    sendPaymentError(res, error, "Error al sincronizar los pagos");
  }
};

export const webhook = async (req, res) => {
  try {
    const type = req.query.type || req.body?.type;
    const paymentId = req.query["data.id"] || req.body?.data?.id;

    if (type === "payment" && paymentId) {
      await pagoService.applyPaymentNotification(paymentId);
    }
  } catch (error) {
    console.error("Error en webhook de MercadoPago:", error.message);
  }
  // 200 siempre, aunque falle: con cualquier otro status MercadoPago reintenta indefinidamente
  res.sendStatus(200);
};

export const confirmPayment = async (req, res) => {
  try {
    const result = await pagoService.confirmPayment(req.params.idReserve, req.user.idUser, req.body.payment_id);
    res.json(result);
  } catch (error) {
    sendPaymentError(res, error, "Error al confirmar el pago");
  }
};

export const getPaymentStatus = async (req, res) => {
  try {
    const reserve = await pagoService.getPaymentStatus(req.params.idReserve, req.user.idUser);
    res.json(reserve);
  } catch (error) {
    sendPaymentError(res, error, "Error al consultar el pago");
  }
};

// El admin del complejo registra que cobró en el mostrador el resto de una reserva señada
export const registerCashPayment = async (req, res) => {
  try {
    const reserve = await pagoService.registerCashPayment(req.params.id, actorFrom(req));
    res.json({ message: `Pago en efectivo registrado para la reserva #${reserve.idReserve}.` });
  } catch (error) {
    sendPaymentError(res, error, "Error al registrar el pago en efectivo");
  }
};

export const seePayments = async (req, res) => {
  try {
    const reserves = await pagoService.listPayments(req.query.paymentStatus, actorFrom(req));
    res.status(200).json(reserves);
  } catch (error) {
    sendError(res, error);
  }
};
