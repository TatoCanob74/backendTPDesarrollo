import {DataTypes} from 'sequelize';
import db from '../config/database.js';
import sequelize from '../config/database.js';

const Horario = sequelize.define("Horarios", {
  hora_inicio: {
    type: DataTypes.TIME,
    allowNull: false
  },

  hora_fin: {
    type: DataTypes.TIME,
    allowNull: false
  },

  dia: {
    type: DataTypes.ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'),
    allowNull: false
  }
});{
  timestamps: true
}

export default Horario;