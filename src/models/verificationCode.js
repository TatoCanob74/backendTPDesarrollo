import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const Verification = sequelize.define("verificationCode", {
  idCode: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  hashCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  purposeCode: {
    type: DataTypes.ENUM('REGISTRO', 'RECUPERACION'),
    allowNull: false,
  },
  expiresAtCode: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  usedCode: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  attemptsCode: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
}, {
  tableName: "CodigosVerificacion",
  timestamps: true
});

export default Verification;