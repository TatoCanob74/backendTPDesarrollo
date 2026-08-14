import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Reserve } from './Reserva.js';
import { Service } from './Servicio.js';

export const reserveService = sequelize.define("reservaServicios", {
  idReserve: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },

  idService: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  }
}, {
  tableName: "Reserva_Servicios",
  timestamps: false
});

export default reserveService;



     