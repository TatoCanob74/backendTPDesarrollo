import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const Localidad = sequelize.define("Localidad", {
  idLocalidad: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  nomPais: {
    type: DataTypes.STRING,
    allowNull: false,
    validate:{
      notEmpty: {msg: "El nombre no puede estar vacío."}
  },
  },
  nomLocalidad: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {msg: "El nombre no puede estar vacío."}
    }
  }
})

export default Localidad;