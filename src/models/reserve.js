import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Court } from './court.js';
import { User } from './user.js';
import { Horary } from './horary.js';
import { Service } from './service.js';
import { reserveService } from './reserveService.js';

export const Reserve = sequelize.define("reserve", {
    idReserve: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
    },

    dateReserve: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    
    totalAmount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    stateReserva: {
        type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada'),
        allowNull: false,
        defaultValue: 'pendiente'
    },  

    idUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'idUser'
        }
    },

    idCourt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Court,
            key: 'idCourt'
        }
    },
    idHorary: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'idHorary', 
    references: {
        model: Horary,
        key: 'idHorary'
    }
},
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },

  paymentStatus: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
    tableName: "Reservas",
    timestamps: false
});