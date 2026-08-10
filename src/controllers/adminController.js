import { User } from "../models/usuarios.js";
import { Reserve } from "../models/Reserva.js";
import { Court } from "../models/cancha.js";

export const seeUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        typeUser: "CLIENTE"
      }
    });

    res.status(200).json(users);

  } catch(error) {
    res.status(500).json({error});
  };
};

export const seeReserves = async (req, res) => {
  try {
    const filters = {};
    if (req.query.stateReserva){
      filters.stateReserva = req.query.stateReserva;
    }
    if (req.query.dateReserve){
      filters.dateReserve = req.query.dateReserve;
    }
    const reserves = await Reserve.findAll({
      where: filters
    });
    if (reserves.length === 0){
      return res.status(404).json({msg: "No hay reservas existentes."});
    }
    res.status(200).json(reserves);
  } catch(error) {
    res.status(500).json({error});
  }
};

export const seeCourts = async (req, res) => {
  try {
    const filters = {};
    if (req.query.typeCourt){
      filters.typeCourt = req.query.typeCourt;
    }
    if (req.query.stateCourt){
      filters.stateCourt = req.query.stateCourt;
    }
    const courts = await Court.findAll({ where: filters });
    if (courts.length === 0){
      return res.status(404).json({msg: "No hay canchas disponibles."});  // 👈 agregar return
    }
    res.status(200).json(courts);
  } catch(error){
    res.status(500).json({error: error.message});   // 👈 error.message, no error
  }
};

export const updateUserState = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Si está ACTIVO lo desactiva, si está INACTIVO lo activa
    const newState = user.stateUser === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';

    await user.update({ stateUser: newState });

    res.status(200).json({ message: `Usuario ${newState} exitosamente.` });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /admin/usuarios/:id — eliminar usuario (admin)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

     const reservasDelUsuario = await Reserve.count({ where: { idUser: id } });
      if (reservasDelUsuario > 0) {
        return res.status(409).json({
         error: "No se puede eliminar: el usuario tiene reservas asociadas. Desactivalo en su lugar."
      });
    }

    await user.destroy();
    res.status(200).json({ message: "Usuario eliminado exitosamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};