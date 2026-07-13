import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const Location = sequelize.define("Localidad", {
  idLocation: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  nameCountry: {
    type: DataTypes.STRING,
    allowNull: false,
    validate:{
      notEmpty: {msg: "El nombre no puede estar vacío."}
  },
  },
  nomLocation: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {msg: "El nombre no puede estar vacío."}
    }
  }
}, {
  tableName: "Localidad",
  timestamps: false
});

export default Location;