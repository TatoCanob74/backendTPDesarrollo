import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Complex } from "./complex.js";

export const Court = sequelize.define("court", {
  idCourt: {
    type: DataTypes.INTEGER,
    allowNull : false,
    unique: true,
    primaryKey: true,
    autoIncrement: true
  },

  typeCourt: {
    type: DataTypes.ENUM('FUTBOL', 'TENIS', 'PADEL'),
    allowNull: false
  },
  nameCourt: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "El nombre de la cancha no puede estar vacío." },
      esTexto(value) {
        if (typeof value !== "string") {
          throw new Error("El nombre de la cancha debe ser un texto.");
        }
      }
    }
  },
  hourlyPrice: {
    type: DataTypes.INTEGER,
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
  idComplex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Complex,
      key: 'idComplex'
    }
  }
}, {
  tableName: "Canchas",
  timestamps: false
});

export default Court;
