import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const Location = sequelize.define("Localidad", {
  idLocation: {
    type: DataTypes.INTEGER,
    primaryKey: true
  },
  nameCountry: {
<<<<<<< HEAD
    type: DataTypes.STRING,
    allowNull: false,
    validate:{
      notEmpty: {msg: "El nombre no puede estar vacío."}
  },
  },
  nomLocation: {
=======
>>>>>>> origin/santy
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "El nombre no puede estar vacío." }
    }
  },
  nomLocation: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "El nombre no puede estar vacío." }
    }
  }
}, {
<<<<<<< HEAD
=======
  tableName: "Localidad",
>>>>>>> origin/rama/Francisco
  timestamps: false
});

<<<<<<< HEAD
export default Location;
=======
export default Location;
>>>>>>> origin/santy
