import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Location } from "./location.js";
import { User } from "./user.js";

export const Complex = sequelize.define("complex", {
  idComplex: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nameComplex: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "El nombre del complejo no puede estar vacío." },
      esTexto(value) {
        if (typeof value !== "string") {
          throw new Error("El nombre del complejo debe ser un texto.");
        }
      }
    }
  },
  addressComplex: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "La dirección del complejo no puede estar vacía." },
      esTexto(value) {
        if (typeof value !== "string") {
          throw new Error("La dirección del complejo debe ser un texto.");
        }
      }
    }
  },
  idLocation: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Location,
      key: "idLocation"
    }
  },
  idAdmin: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: true,
    references: {
      model: User,
      key: "idUser"
    }
  }
}, {
  tableName: "Complejos",
  timestamps: false,
  indexes: [
    { unique: true, fields: ["nameComplex", "idLocation"] }
  ]
});

export default Complex;
