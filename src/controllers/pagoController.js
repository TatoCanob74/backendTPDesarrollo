import { Reserve, Court, Horary, Service, Location } from "../models/association.js";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { Op } from "sequelize";

const cliente = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL;

// MercadoPago solo acepta back_urls https: con http las devuelve vacías y sin ningún error
const canAutoReturn = FRONTEND_URL.startsWith("https://");

if (!canAutoReturn) {
  console.warn(
    `[pagos] FRONTEND_URL es "${FRONTEND_URL}" (no https): MercadoPago no va a ` +
      "redirigir al usuario de vuelta. Para la vuelta automática, exponé el " +
      "frontend por https (ngrok, cloudflared) y poné esa URL en FRONTEND_URL."
  );
}

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

    const volverA = (ruta) => `${FRONTEND_URL}${ruta}?reserva=${reserve.idReserve}`;

    const body = {
      items: [
        {
          id: String(reserve.idReserve),
          title: `Reserva de cancha ${reserve.court?.typeCourt ?? ""} - ${reserve.dateReserve}`,
          quantity: 1,
          unit_price: Number(reserve.totalAmount),
          currency_id: "ARS"
        }
      ],
      external_reference: String(reserve.idReserve)
    };

    if (canAutoReturn) {
      body.back_urls = {
        success: volverA("/pago/exito"),
        failure: volverA("/pago/error"),
        pending: volverA("/pago/pendiente")
      };
      body.auto_return = "approved";
    }

    if (BACKEND_URL && !BACKEND_URL.includes("localhost")) {
      body.notification_url = `${BACKEND_URL}/pagos/webhook`;
    }

    const preference = new Preference(cliente);

    let resultado;
    let autoReturn = canAutoReturn;
    try {
      resultado = await preference.create({ body });
    } catch (error) {
      if (!body.auto_return) throw error;
      console.warn("MercadoPago rechazó auto_return, se reintenta sin él:", error.message);
      delete body.auto_return;
      autoReturn = false;
      resultado = await preference.create({ body });
    }

    res.json({
      id: resultado.id,
      init_point: resultado.init_point,
      sandbox_init_point: resultado.sandbox_init_point,
      autoReturn
    });
  } catch (error) {
    res.status(500).json({ message: "Error al crear la preferencia de pago", error: error.message });
  }
};

const syncReserveWithMercadoPago = async (reserve) => {
  if (!process.env.MP_ACCESS_TOKEN) return false;
  if (reserve.stateReserva === "confirmada" || reserve.stateReserva === "cancelada") return false;

  const { results = [] } = await new Payment(cliente).search({
    options: {
      external_reference: String(reserve.idReserve),
      sort: "date_created",
      criteria: "desc"
    }
  });

  if (results.length === 0) return false;

  const payment = results.find((p) => p.status === "approved") ?? results[0];

  if (String(payment.id) === reserve.paymentId && payment.status === reserve.paymentStatus) {
    return false;
  }

  reserve.paymentId = String(payment.id);
  reserve.paymentStatus = payment.status;

  if (payment.status === "approved") {
    reserve.stateReserva = "confirmada";
  }

  await reserve.save();
  return true;
};

export const syncMyPayments = async (req, res) => {
  try {
    const pendientes = await Reserve.findAll({
      where: { idUser: req.user.idUser, stateReserva: "pendiente" }
    });

    let updated = 0;
    for (const reserve of pendientes) {
      try {
        if (await syncReserveWithMercadoPago(reserve)) updated += 1;
      } catch (error) {
        console.error(`No se pudo sincronizar la reserva ${reserve.idReserve}:`, error.message);
      }
    }

    res.json({ checked: pendientes.length, updated });
  } catch (error) {
    res.status(500).json({ message: "Error al sincronizar los pagos", error: error.message });
  }
};

export const webhook = async (req, res) => {
  try {
    const type = req.query.type || req.body?.type;
    const paymentId = req.query["data.id"] || req.body?.data?.id;

    if (type !== "payment" || !paymentId) {
      return res.sendStatus(200);
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

    await reserve.save();
    res.sendStatus(200);
  } catch (error) {
    console.error("Error en webhook de MercadoPago:", error.message);
    // 200 aunque falle: con cualquier otro status MercadoPago reintenta indefinidamente
    res.sendStatus(200);
  }
};

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

    // El pago se verifica contra MercadoPago: nunca se confía en lo que manda el frontend
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

export const getPaymentStatus = async (req, res) => {
  try {
    const reserve = await Reserve.findByPk(req.params.idReserve, {
      include: [
        { model: Court, include: [Location] },
        Horary,
        { model: Service, as: "services" }
      ]
    });

    if (!reserve) {
      return res.status(404).json({ message: "La reserva no existe" });
    }

    if (reserve.idUser !== req.user.idUser) {
      return res.status(403).json({ message: "La reserva no pertenece al usuario" });
    }

    try {
      await syncReserveWithMercadoPago(reserve);
    } catch (error) {
      console.error("No se pudo sincronizar con MercadoPago:", error.message);
    }

    res.json(reserve);
  } catch (error) {
    res.status(500).json({ message: "Error al consultar el pago", error: error.message });
  }
};

export const seePayments = async (req, res) => {
  try {
    const filters = { paymentId: { [Op.ne]: null } };

    if (req.query.paymentStatus) {
      filters.paymentStatus = req.query.paymentStatus;
    }

    const reserves = await Reserve.findAll({ where: filters });

    res.status(200).json(reserves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};