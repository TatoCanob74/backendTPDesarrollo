import { Reserve, Court, Horary, Service, Location, Complex } from "../models/association.js";
import { complexFilter, canManageComplex, FORBIDDEN_COMPLEX } from "../utils/complexScope.js";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { Op } from "sequelize";
import { DateTime } from "luxon";

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

const PAYMENT_METHODS = ["MERCADO_PAGO", "EFECTIVO"];

// Quien paga en efectivo asegura el turno con una seña online; el resto lo cobra el complejo
export const DEPOSIT_PERCENT = 25;
export const depositFor = (totalAmount) => Math.ceil((Number(totalAmount) * DEPOSIT_PERCENT) / 100);

export const createPreference = async (req, res) => {
  try {
    const paymentMethod = req.body?.metodo ?? "MERCADO_PAGO";
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: `Forma de pago inválida. Debe ser una de: ${PAYMENT_METHODS.join(", ")}.` });
    }

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

    if (reserve.stateReserva === "vencida" || (reserve.stateReserva === "pendiente" && paymentDeadline(reserve) <= new Date())) {
      return res.status(409).json({
        message: `Venció el plazo de ${PAYMENT_WINDOW_MINUTES} minutos para pagar esta reserva. Hacé una nueva.`
      });
    }

    if (reserve.stateReserva !== "pendiente") {
      return res.status(409).json({ message: "La reserva no se puede pagar en su estado actual" });
    }

    const isCash = paymentMethod === "EFECTIVO";
    const amount = isCash ? depositFor(reserve.totalAmount) : Number(reserve.totalAmount);

    // Se guarda ya para que "Pagar" desde Mis reservas retome la misma forma de pago
    await reserve.update({ paymentMethod, depositAmount: isCash ? amount : null });

    const volverA = (ruta) => `${FRONTEND_URL}${ruta}?reserva=${reserve.idReserve}`;

    const titulo = `Reserva de cancha ${reserve.court?.typeCourt ?? ""} - ${reserve.dateReserve}`;

    const body = {
      items: [
        {
          id: String(reserve.idReserve),
          title: isCash ? `Seña ${DEPOSIT_PERCENT}% - ${titulo}` : titulo,
          quantity: 1,
          unit_price: amount,
          currency_id: "ARS"
        }
      ],
      external_reference: String(reserve.idReserve),
      // Viaja con el pago: si el usuario cambió de forma de pago, manda la del pago que se aprobó
      metadata: { metodo_pago: paymentMethod },
      // El checkout deja de aceptar pagos cuando vence la reserva: así no se cobra un horario liberado
      expires: true,
      expiration_date_to: DateTime.fromJSDate(paymentDeadline(reserve)).toISO()
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

// Copia el estado del pago en la reserva. Solo una reserva pendiente pasa a confirmada:
// una cancelada no se revive, porque su horario ya pudo haberlo reservado otra persona
const applyPayment = (reserve, payment) => {
  reserve.paymentId = String(payment.id);
  reserve.paymentStatus = payment.status;

  if (payment.status === "approved" && reserve.stateReserva === "pendiente") {
    reserve.stateReserva = "confirmada";

    const paymentMethod = payment.metadata?.metodo_pago;
    if (PAYMENT_METHODS.includes(paymentMethod)) {
      reserve.paymentMethod = paymentMethod;
      reserve.depositAmount = paymentMethod === "EFECTIVO" ? Math.round(Number(payment.transaction_amount)) : null;
    }
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

  applyPayment(reserve, payment);

  await reserve.save();
  return true;
};

// Una reserva pendiente retiene el horario solo un rato: si no se paga a tiempo, vence y lo libera
export const PAYMENT_WINDOW_MINUTES = 30;
// Margen después del plazo para un pago que se empezó justo antes de que venciera
const EXPIRATION_GRACE_MINUTES = 5;
// Estados de Mercado Pago con la plata en camino: mientras tanto la reserva no vence
const PAYMENT_IN_PROGRESS = ["pending", "in_process", "in_mediation", "authorized"];

const minutesToMs = (minutes) => minutes * 60 * 1000;

export const paymentDeadline = (reserve) =>
  new Date(new Date(reserve.createdReserve).getTime() + minutesToMs(PAYMENT_WINDOW_MINUTES));

// Vence una reserva pendiente que pasó el plazo. Antes le pregunta a Mercado Pago: si el pago
// se aprobó, la reserva se confirma en vez de vencer. Si la consulta falla, el error sube y la
// reserva queda como está hasta el próximo intento: nunca se vence a ciegas.
const expireIfStale = async (reserve) => {
  if (reserve.stateReserva !== "pendiente") return false;

  const limit = paymentDeadline(reserve).getTime() + minutesToMs(EXPIRATION_GRACE_MINUTES);
  if (Date.now() < limit) return false;

  await syncReserveWithMercadoPago(reserve);

  if (reserve.stateReserva !== "pendiente") return false;
  if (PAYMENT_IN_PROGRESS.includes(reserve.paymentStatus)) return false;

  await reserve.update({ stateReserva: "vencida" });
  return true;
};

// Vence las reservas pendientes sin pagar. `where` acota la búsqueda (un usuario, un horario)
export const expireStaleReserves = async (where = {}) => {
  const createdBefore = new Date(
    Date.now() - minutesToMs(PAYMENT_WINDOW_MINUTES + EXPIRATION_GRACE_MINUTES)
  );

  const stale = await Reserve.findAll({
    where: { ...where, stateReserva: "pendiente", createdReserve: { [Op.lt]: createdBefore } }
  });

  let expired = 0;
  for (const reserve of stale) {
    try {
      if (await expireIfStale(reserve)) expired += 1;
    } catch (error) {
      console.error(`No se pudo revisar el vencimiento de la reserva ${reserve.idReserve}:`, error.message);
    }
  }
  return expired;
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

    // Así el usuario ve como vencidas las que ya no puede pagar
    const expired = await expireStaleReserves({ idUser: req.user.idUser });

    res.json({ checked: pendientes.length, updated, expired });
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

    applyPayment(reserve, payment);

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

    applyPayment(reserve, payment);

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
        { model: Court, include: [{ model: Complex, include: [Location] }] },
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
      await expireIfStale(reserve);
    } catch (error) {
      console.error("No se pudo sincronizar con MercadoPago:", error.message);
    }

    res.json(reserve);
  } catch (error) {
    res.status(500).json({ message: "Error al consultar el pago", error: error.message });
  }
};

// El admin del complejo registra que cobró en el mostrador el resto de una reserva señada
export const registerCashPayment = async (req, res) => {
  try {
    const reserve = await Reserve.findByPk(req.params.id, { include: [Court] });

    if (!reserve) {
      return res.status(404).json({ message: "La reserva no existe" });
    }

    if (!canManageComplex(req, reserve.court.idComplex)) {
      return res.status(403).json({ message: FORBIDDEN_COMPLEX });
    }

    if (reserve.paymentMethod !== "EFECTIVO") {
      return res.status(409).json({ message: "La reserva no se paga en efectivo" });
    }

    if (reserve.stateReserva !== "confirmada") {
      return res.status(409).json({ message: "Solo se puede cobrar el resto de una reserva señada" });
    }

    if (reserve.cashPaidAt) {
      return res.status(409).json({ message: "El pago en efectivo ya estaba registrado" });
    }

    await reserve.update({ cashPaidAt: new Date(), cashRegisteredBy: req.user.idUser });

    res.json({ message: `Pago en efectivo registrado para la reserva #${reserve.idReserve}.` });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar el pago en efectivo", error: error.message });
  }
};

export const seePayments = async (req, res) => {
  try {
    const filters = { paymentId: { [Op.ne]: null } };

    if (req.query.paymentStatus) {
      filters.paymentStatus = req.query.paymentStatus;
    }

    // El admin de un complejo solo ve los pagos de las canchas de su complejo
    const reserves = await Reserve.findAll({
      where: filters,
      include: [{ model: Court, where: complexFilter(req), attributes: ["idCourt", "nameCourt", "idComplex"] }]
    });

    res.status(200).json(reserves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};