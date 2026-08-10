import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Court } from './cancha.js';

export const Horary = sequelize.define("Horarios", {
  idHorary: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  idCourt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Court,
      key: 'idCourt'
    }
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  day: {
    type: DataTypes.ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'),
    allowNull: false
  }
}, {
  tableName: "Horarios",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['idCourt', 'day', 'startTime']
    }
  ]
});

export default Horary;
