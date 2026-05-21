import { Reserva } from "../models/reserva.js";
import { Cancha } from "../models/cancha.js";


const listarReservas = async (req, res) => {
  try {
    const reservas = await Reserva.findAll();
    res.status(200).json(reservas);
  } catch (error) {
    res.status(500).json({ message: 'Error al listar reservas' });
  }
};
