import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Reserve } from './reserve.js';
import { Service } from './service.js';

export const reserveService = sequelize.define("reserveService", {
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



     