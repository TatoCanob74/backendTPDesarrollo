import { Usuario } from "../models/usuarios.js";
import { Reserva } from "../models/Reserva.js";

export const verUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      where: {
        tipo: "CLIENTE"
      }
    });

    res.status(200).json(usuarios);

  } catch(error) {
    res.status(500).json({error});
  };
};

export const verReservas = async (req, res) => {
  try {
    const filtros = {};
    if (req.query.estado){
      filtros.estado = req.query.estado;
    }
    if (req.query.fecha){
      filtros.fecha = req.query.fecha;
    }
    try {
      const reservas = await Reserva.findAll({
        where: filtros
        });
    } catch(error) {
      res.status(400).json({msg: "No hay reservas."});
    }
  } catch(error) {
    res.status(500).json({error});
  }
};