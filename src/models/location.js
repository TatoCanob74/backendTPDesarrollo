import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const Location = sequelize.define("location", {
  idLocation: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nameCountry: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "El país no puede estar vacío." },
      esTexto(value) {
        if (typeof value !== "string") {
          throw new Error("El país debe ser un texto.");
        }
      }
    }
  },
  nomLocation: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "El nombre de la localidad no puede estar vacío." },
      esTexto(value) {
        if (typeof value !== "string") {
          throw new Error("El nombre de la localidad debe ser un texto.");
        }
      }
    }
  }
}, {
  tableName: "Localidads",
  timestamps: false,
  indexes: [
    { unique: true, fields: ["nameCountry", "nomLocation"] }
  ]
});

export default Location;
