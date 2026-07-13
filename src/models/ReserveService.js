import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ReserveService = sequelize.define("ReserveService", {
  idReserve: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  idService: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false
});

export default ReserveService;
