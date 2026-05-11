import Reserva from '../models/Reserva.js';

// Crear una nueva reserva
const crearReserva = async (req, res) => {
  try{
  // El cliente pone sus dato y momentaneamente ponemos usuario_id fijo pero despues sera pasado con el JWT
  const { fecha, cancha_id, horario_id, servicios, usuario_id } = req.body;
  if (!fecha || !cancha_id || !horario_id || !usuario_id) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }
  const reserva = await Reserva.create({

    fecha,
    cancha_id,
    horario_id,
    usuario_id,
    monto_total: 0, // Inicialmente el monto total es 0, se calculará después
  });
     if (servicios && servicios.length > 0) {
    await reserva.setServicios(servicios); // Asocia los servicios a la reserva
  }
  res.status(201).json({ message: "Reserva creada exitosamente", reserva });
}catch (error) {
  res.status(500).json({ message: "Error al crear la reserva", error});
}
};

export default crearReserva;