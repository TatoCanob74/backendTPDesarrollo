import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const Cancha = sequelize.define("Cancha", {
  idCancha: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tipoCancha: {
    type: DataTypes.ENUM('FUTBOL', 'TENIS', 'PADEL'),
    allowNull: false
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  precioHora: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  estado: {
    type: DataTypes.ENUM('DISPONIBLE', 'OCUPADO'),
    allowNull: false
  },
  capacidadJugadores: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
})