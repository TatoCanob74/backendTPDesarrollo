import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Reserve } from './Reserva.js';

export const Service = sequelize.define("Servicios", {
    idService: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    nameService: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "El nombre del servicio no puede estar vacío." },
        esTexto(value) {
          if (typeof value !== "string") {
            throw new Error("El nombre del servicio debe ser un texto.");
          }
        }
      }
    },

    priceService: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    descriptionService : {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "La descripción del servicio no puede estar vacía." },
        esTexto(value) {
          if (typeof value !== "string") {
            throw new Error("La descripción del servicio debe ser un texto.");
          }
        }
      }
    }

}, {
  tableName: "Servicios",
  timestamps: false
});
