import { Reserve, Court } from "../models/association.js";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { Op } from "sequelize";

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

    // La reserva viaja también en la query de las back_urls: si MercadoPago no
    // manda external_reference al volver, el frontend igual sabe qué reserva es.
    const volverA = (ruta) => `${FRONTEND_URL}${ruta}?reserva=${reserve.idReserve}`;

    const body = {
      items: [
        {
          id: String(reserve.idReserve),
          title: `Reserva de cancha ${reserve.Cancha?.typeCourt ?? ""} - ${reserve.dateReserve}`,
          quantity: 1,
          unit_price: Number(reserve.totalAmount),
          currency_id: "ARS"
        }
      ],
      // Permite identificar la reserva cuando llega el webhook
      external_reference: String(reserve.idReserve),
      back_urls: {
        success: volverA("/pago/exito"),
        failure: volverA("/pago/error"),
        pending: volverA("/pago/pendiente")
      },
      // Sin esto MercadoPago deja al usuario en su propia pantalla final y nunca
      // vuelve solo a CanchaYa. Si la back_url no le sirve, se reintenta sin él.
      auto_return: "approved"
    };

    // notification_url solo sirve con una URL pública: MercadoPago no puede
    // llamar a localhost. Sin webhook, la confirmación queda a cargo del
    // frontend al volver del checkout y de la sincronización manual.
    if (BACKEND_URL && !BACKEND_URL.includes("localhost")) {
      body.notification_url = `${BACKEND_URL}/pagos/webhook`;
    }

    const preference = new Preference(cliente);

    let resultado;
    try {
      resultado = await preference.create({ body });
    } catch (error) {
      if (!body.auto_return) throw error;
      // MercadoPago rechaza auto_return cuando no acepta la back_url. El checkout
      // igual funciona: el usuario vuelve con el botón "Volver al sitio".
      console.warn("MercadoPago rechazó auto_return, se reintenta sin él:", error.message);
      delete body.auto_return;
      resultado = await preference.create({ body });
    }

    res.json({
      id: resultado.id,
      init_point: resultado.init_point,          // link real de pago
      sandbox_init_point: resultado.sandbox_init_point // link de pruebas
    });
  } catch (error) {
    res.status(500).json({ message: "Error al crear la preferencia de pago", error: error.message });
  }
};

/**
 * Busca en MercadoPago los pagos hechos contra una reserva y actualiza su estado.
 *
 * Hace falta porque en desarrollo local MercadoPago no puede llamar al webhook
 * (no hay URL pública) y, si el usuario cierra la pestaña antes de volver, la
 * reserva se quedaría en "pendiente" para siempre aunque el pago esté aprobado.
 *
 * Devuelve true si la reserva cambió.
 */
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

  // Si hubo varios intentos, manda el aprobado; si no, el más reciente.
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

// POST /reservas/sincronizar-pagos — pone al día las reservas pendientes del usuario
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
        // Si MercadoPago falla para una reserva, se sigue con las demás
        console.error(`No se pudo sincronizar la reserva ${reserve.idReserve}:`, error.message);
      }
    }

    res.json({ checked: pendientes.length, updated });
  } catch (error) {
    res.status(500).json({ message: "Error al sincronizar los pagos", error: error.message });
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

    // Antes de contestar se consulta MercadoPago, así el estado que ve el usuario
    // es el real aunque el webhook nunca haya llegado.
    try {
      await syncReserveWithMercadoPago(reserve);
    } catch (error) {
      console.error("No se pudo sincronizar con MercadoPago:", error.message);
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

// GET /admin/pagos — el admin ve todos los pagos registrados
export const seePayments = async (req, res) => {
  try {
    const filters = { paymentId: { [Op.ne]: null } }; // solo reservas que ya tienen un intento de pago

    if (req.query.paymentStatus) {
      filters.paymentStatus = req.query.paymentStatus;
    }

    const reserves = await Reserve.findAll({ where: filters });

    if (reserves.length === 0) {
      return res.status(404).json({ message: "No hay pagos registrados." });
    }

    res.status(200).json(reserves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};