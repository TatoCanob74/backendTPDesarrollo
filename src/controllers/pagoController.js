import { Reserve } from "../models/Reserva.js";

const cliente = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
});

export const pago = async (req, res) => {
  try {
    const reserva = await Reserva.findByPk(req.params.idReserva);

    const resultado = await Preference(cliente);

    preference.create({
      body: {
        items: [
          {
            title: "Alquiler",
            quantity: 1,
            unit_price: reserva.monto_total
          }
        ]
      }
    })
    res.json({ id: resultado.idReserva });
   } catch(error){
    res.status(500).json({ error: error.message });
  };
}