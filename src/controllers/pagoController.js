import { Reserve } from "../models/Reserva.js";
<<<<<<< HEAD
=======
import { Court } from "../models/cancha.js";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
>>>>>>> origin/santy

const cliente = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

// URL del frontend a donde vuelve el usuario después de pagar
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
// URL pública del backend (necesaria para que MercadoPago pueda notificar el pago)
const BACKEND_URL = process.env.BACKEND_URL;

// POST /reserves/:idReserve/pago — crea la preferencia de pago y devuelve el link de checkout
export const createPreference = async (req, res) => {
  try {
    const reserve = await Reserve.findByPk(req.params.idReserve, {
      include: [Court]
    });

    if (!reserve) {
      return res.status(404).json({ message: "La reserva no existe" });
    }

    if (reserve.idUser !== req.user.idUser) {
      return res.status(403).json({ message: "La reserva no pertenece al usuario" });
    }

    if (reserve.stateReserva === "confirmada") {
      return res.status(409).json({ message: "La reserva ya está pagada" });
    }

    if (reserve.stateReserva === "cancelada") {
      return res.status(409).json({ message: "La reserva está cancelada" });
    }

    const body = {
      items: [
        {
          id: String(reserve.idReserve),
          title: `Reserva de cancha ${reserve.Court?.typeCourt ?? ""} - ${reserve.dateReserve}`,
          quantity: 1,
          unit_price: Number(reserve.totalAmount),
          currency_id: "ARS"
        }
      ],
      // Permite identificar la reserva cuando llega el webhook
      external_reference: String(reserve.idReserve),
      back_urls: {
        success: `${FRONTEND_URL}/pago/exito`,
        failure: `${FRONTEND_URL}/pago/error`,
        pending: `${FRONTEND_URL}/pago/pendiente`
      }
    };

    // auto_return y notification_url solo funcionan con URLs públicas (no localhost)
    if (!FRONTEND_URL.includes("localhost")) {
      body.auto_return = "approved";
    }
    if (BACKEND_URL && !BACKEND_URL.includes("localhost")) {
      body.notification_url = `${BACKEND_URL}/pagos/webhook`;
    }

    const preference = new Preference(cliente);
    const resultado = await preference.create({ body });

    res.json({
      id: resultado.id,
      init_point: resultado.init_point,          // link real de pago
      sandbox_init_point: resultado.sandbox_init_point // link de pruebas
    });
  } catch (error) {
    res.status(500).json({ message: "Error al crear la preferencia de pago", error: error.message });
  }
};

// POST /pagos/webhook — MercadoPago avisa acá cuando cambia el estado de un pago
export const webhook = async (req, res) => {
  try {
    // MercadoPago puede mandar la notificación por query params o por body
    const type = req.query.type || req.body?.type;
    const paymentId = req.query["data.id"] || req.body?.data?.id;

    if (type !== "payment" || !paymentId) {
      return res.sendStatus(200); // notificación que no nos interesa
    }

    const payment = await new Payment(cliente).get({ id: paymentId });
    const idReserve = payment.external_reference;

    if (!idReserve) {
      return res.sendStatus(200);
    }

    const reserve = await Reserve.findByPk(idReserve);
    if (!reserve) {
      return res.sendStatus(200);
    }

    reserve.paymentId = String(payment.id);
    reserve.paymentStatus = payment.status;

    if (payment.status === "approved") {
      reserve.stateReserva = "confirmada";
    }
    // Si el pago fue rechazado la reserva queda pendiente y el usuario puede reintentar

    await reserve.save();
    res.sendStatus(200);
  } catch (error) {
    console.error("Error en webhook de MercadoPago:", error.message);
    // Devolvemos 200 igual para que MercadoPago no reintente infinitamente
    res.sendStatus(200);
  }
};

// POST /reserves/:idReserve/pago/confirmar — confirma el pago verificándolo contra MercadoPago.
// MercadoPago agrega ?payment_id=... a la back_url; el frontend lo manda acá.
// Útil en desarrollo local donde el webhook no puede llegar.
export const confirmPayment = async (req, res) => {
  try {
    const { payment_id } = req.body;
    if (!payment_id) {
      return res.status(400).json({ message: "Falta el payment_id" });
    }

    const reserve = await Reserve.findByPk(req.params.idReserve);

    if (!reserve) {
      return res.status(404).json({ message: "La reserva no existe" });
    }

    if (reserve.idUser !== req.user.idUser) {
      return res.status(403).json({ message: "La reserva no pertenece al usuario" });
    }

    // Se verifica el pago directamente contra MercadoPago, nunca se confía en el frontend
    const payment = await new Payment(cliente).get({ id: payment_id });

    if (payment.external_reference !== String(reserve.idReserve)) {
      return res.status(400).json({ message: "El pago no corresponde a esta reserva" });
    }

    reserve.paymentId = String(payment.id);
    reserve.paymentStatus = payment.status;

    if (payment.status === "approved") {
      reserve.stateReserva = "confirmada";
    }

    await reserve.save();

    res.json({
      message: payment.status === "approved" ? "Pago confirmado" : `El pago está en estado: ${payment.status}`,
      stateReserva: reserve.stateReserva,
      paymentStatus: reserve.paymentStatus
    });
  } catch (error) {
    res.status(500).json({ message: "Error al confirmar el pago", error: error.message });
  }
};

// GET /reserves/:idReserve/pago — el frontend consulta acá el estado después de volver del checkout
export const getPaymentStatus = async (req, res) => {
  try {
    const reserve = await Reserve.findByPk(req.params.idReserve);

    if (!reserve) {
      return res.status(404).json({ message: "La reserva no existe" });
    }

    if (reserve.idUser !== req.user.idUser) {
      return res.status(403).json({ message: "La reserva no pertenece al usuario" });
    }

    res.json({
      idReserve: reserve.idReserve,
      stateReserva: reserve.stateReserva,
      paymentStatus: reserve.paymentStatus,
      paymentId: reserve.paymentId
    });
  } catch (error) {
    res.status(500).json({ message: "Error al consultar el pago", error: error.message });
  }
};
