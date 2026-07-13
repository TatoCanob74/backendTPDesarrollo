import { Reserve } from "../models/Reserva.js";
import { MercadoPagoConfig, Preference } from "mercadopago";

const cliente = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

export const pago = async (req, res) => {
  try {
    const reserve = await Reserve.findByPk(req.params.idReserve);

    const preference = new Preference(cliente);

    const resultado = await preference.create({
      body: {
        items: [
          {
            title: "Alquiler",
            quantity: 1,
            unit_price: reserve.totalAmount
          }
        ]
      }
    });
    res.json({ id: resultado.id });
  } catch(error){
    res.status(500).json({ error: error.message });
  };
}
