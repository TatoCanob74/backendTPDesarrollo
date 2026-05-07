import {DataTypes} from 'sequelize';
import db from '../config/database.js';
import Reserva from './Reserva.js';
import Servicio from './Servicio.js';

const ReservaServicio = db.define('reserva_servicio', {
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
