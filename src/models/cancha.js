import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Locate } from "./localidad.js";

export const Court = sequelize.define("Cancha", {
  idCourt: {
    type: DataTypes.INTEGER,
    allowNull = false
  },

  typeCourt: {
    type: DataTypes.ENUM('FUTBOL', 'TENIS', 'PADEL'),
    allowNull: false
  },

  nameCourt: {
    type: DataTypes.STRING,
    allowNull: false
  },

  hourlyPrice: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: false
  },

  stateCourt: {
    type: DataTypes.ENUM('DISPONIBLE', 'OCUPADO'),
    allowNull: false
  },

  capacityPlayers: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  idLocateCourt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: {Locate},
      key: 'idLocate'
    }
  }
}); {
  tableName: "Cancha";
  timestamps: false;
}

export default Court;