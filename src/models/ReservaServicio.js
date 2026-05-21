import {DataTypes} from 'sequelize';
import sequelize from '../config/database.js';
import Reserva from './reserva.js';
import Servicio from './servicio.js';

const ReservaServicio = sequelize.define("reservaServicios", {
  reserva_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Reserva,
      key: 'id'
    }
  },

  servicio_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Servicio,
      key: 'id'
    }
  }
});

export default ReservaServicio;
