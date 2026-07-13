import { User } from "../models/usuarios.js";
import { Reserve } from "../models/Reserva.js";

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
