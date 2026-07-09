import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Reserve } from './Reserva.js';
import { Service } from './Servicio.js';

const reserveService = sequelize.define("reservaServicios", {
  idReserve: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Reserve,
      key: 'idReserve'
    }
  },

  idService: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Service,
      key: 'idService'
    }
  }
});

