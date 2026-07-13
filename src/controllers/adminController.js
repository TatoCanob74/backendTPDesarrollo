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
    if (req.query.stateReserve){
      filters.stateReserve = req.query.stateReserve;
    }
    if (req.query.dateReserve){
      filters.dateReserve = req.query.dateReserve;
    }
    const reserves = await Reserve.findAll({
      where: filters
    });
    if (reserves.length === 0){
      res.status(404).json({msg: "No hay reservas existentes."});
    }
    res.status(200).json(reserves);
  } catch(error) {
    res.status(500).json({error});
  }
};

export const seeCourts = async (req, res) => {
  try {
    const filters = {};
    if (req.query.courtType){
      filters.courtType = req.query.courtType;
    }
    if (req.query.courtState){
      filters.courtState = req.query.courtState;
    }
    const courts = await Cancha.findAll({
      where: filters
    });
    if (courts.length === 0){
      res.status(404).json({msg: "No hay canchas disponibles."});
    }
    res.status(200).json(courts);
  } catch(error){
    res.status(500).json({error});
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