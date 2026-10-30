import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { Op } from "sequelize";
import { DateTime } from "luxon";
import { Reserve, Court, Horary, Service, Location, Complex } from "../models/association.js";
import { HttpError } from "../utils/httpError.js";
import { complexFilter, canManageComplex, FORBIDDEN_COMPLEX } from "../utils/complexScope.js";

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

export const PAYMENT_METHODS = ["MERCADO_PAGO", "EFECTIVO"];

// Quien paga en efectivo asegura el turno con una seña online; el resto lo cobra el complejo
export const DEPOSIT_PERCENT = 25;
export const depositFor = (totalAmount) => Math.ceil((Number(totalAmount) * DEPOSIT_PERCENT) / 100);

// Una reserva pendiente retiene el horario solo un rato: si no se paga a tiempo, vence y lo libera
export const PAYMENT_WINDOW_MINUTES = 30;
// Margen después del plazo para un pago que se empezó justo antes de que venciera
const EXPIRATION_GRACE_MINUTES = 5;
// Estados de Mercado Pago con la plata en camino: mientras tanto la reserva no vence
const PAYMENT_IN_PROGRESS = ["pending", "in_process", "in_mediation", "authorized"];

const minutesToMs = (minutes) => minutes * 60 * 1000;

export const paymentDeadline = (reserve) =>
  new Date(new Date(reserve.createdReserve).getTime() + minutesToMs(PAYMENT_WINDOW_MINUTES));

// Busca la reserva y verifica que sea del usuario que la quiere pagar
const findOwnReserve = async (idReserve, idUser, options = {}) => {
  const reserve = await Reserve.findByPk(idReserve, options);

  if (!reserve) {
    throw new HttpError(404, "La reserva no existe");
  }

  if (reserve.idUser !== idUser) {
    throw new HttpError(403, "La reserva no pertenece al usuario");
  }
  return reserve;
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

export const createPreference = async (idReserve, idUser, paymentMethod) => {
  const reserve = await findOwnReserve(idReserve, idUser, { include: [Court] });

  if (reserve.stateReserva === "confirmada") {
    throw new HttpError(409, "La reserva ya está pagada");
  }

  if (reserve.stateReserva === "cancelada") {
    throw new HttpError(409, "La reserva está cancelada");
  }

  if (reserve.stateReserva === "vencida" || (reserve.stateReserva === "pendiente" && paymentDeadline(reserve) <= new Date())) {
    throw new HttpError(409, `Venció el plazo de ${PAYMENT_WINDOW_MINUTES} minutos para pagar esta reserva. Hacé una nueva.`);
  }

  if (reserve.stateReserva !== "pendiente") {
    throw new HttpError(409, "La reserva no se puede pagar en su estado actual");
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

  return {
    id: resultado.id,
    init_point: resultado.init_point,
    sandbox_init_point: resultado.sandbox_init_point,
    autoReturn
  };
};

export const syncUserPayments = async (idUser) => {
  const pendientes = await Reserve.findAll({
    where: { idUser, stateReserva: "pendiente" }
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
  const expired = await expireStaleReserves({ idUser });

  return { checked: pendientes.length, updated, expired };
};

// Aplica a la reserva un pago que notificó MercadoPago. Si no corresponde a ninguna reserva, no hace nada
export const applyPaymentNotification = async (paymentId) => {
  const payment = await new Payment(cliente).get({ id: paymentId });
  const idReserve = payment.external_reference;

  if (!idReserve) return;

  const reserve = await Reserve.findByPk(idReserve);
  if (!reserve) return;

  applyPayment(reserve, payment);
  await reserve.save();
};

export const confirmPayment = async (idReserve, idUser, paymentId) => {
  const reserve = await findOwnReserve(idReserve, idUser);

  // El pago se verifica contra MercadoPago: nunca se confía en lo que manda el frontend
  const payment = await new Payment(cliente).get({ id: paymentId });

  if (payment.external_reference !== String(reserve.idReserve)) {
    throw new HttpError(400, "El pago no corresponde a esta reserva");
  }

  applyPayment(reserve, payment);
  await reserve.save();

  return {
    message: payment.status === "approved" ? "Pago confirmado" : `El pago está en estado: ${payment.status}`,
    stateReserva: reserve.stateReserva,
    paymentStatus: reserve.paymentStatus
  };
};

export const getPaymentStatus = async (idReserve, idUser) => {
  const reserve = await findOwnReserve(idReserve, idUser, {
    include: [
      { model: Court, include: [{ model: Complex, include: [Location] }] },
      Horary,
      { model: Service, as: "services" }
    ]
  });

  try {
    await syncReserveWithMercadoPago(reserve);
    await expireIfStale(reserve);
  } catch (error) {
    console.error("No se pudo sincronizar con MercadoPago:", error.message);
  }

  return reserve;
};

// El admin del complejo registra que cobró en el mostrador el resto de una reserva señada
export const registerCashPayment = async (idReserve, actor) => {
  const reserve = await Reserve.findByPk(idReserve, { include: [Court] });

  if (!reserve) {
    throw new HttpError(404, "La reserva no existe");
  }

  if (!canManageComplex(actor, reserve.court.idComplex)) {
    throw new HttpError(403, FORBIDDEN_COMPLEX);
  }

  if (reserve.paymentMethod !== "EFECTIVO") {
    throw new HttpError(409, "La reserva no se paga en efectivo");
  }

  if (reserve.stateReserva !== "confirmada") {
    throw new HttpError(409, "Solo se puede cobrar el resto de una reserva señada");
  }

  if (reserve.cashPaidAt) {
    throw new HttpError(409, "El pago en efectivo ya estaba registrado");
  }

  await reserve.update({ cashPaidAt: new Date(), cashRegisteredBy: actor.idUser });
  return reserve;
};

// El admin de un complejo solo ve los pagos de las canchas de su complejo
export const listPayments = (paymentStatus, actor) => {
  const filters = { paymentId: { [Op.ne]: null } };
  if (paymentStatus) filters.paymentStatus = paymentStatus;

  return Reserve.findAll({
    where: filters,
    include: [{ model: Court, where: complexFilter(actor), attributes: ["idCourt", "nameCourt", "idComplex"] }]
  });
};
