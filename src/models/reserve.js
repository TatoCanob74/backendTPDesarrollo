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
        // ausente: tenía el turno asegurado y no se presentó
        // vencida: quedó pendiente sin pagar más allá del plazo y se liberó el horario
        type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'ausente', 'vencida'),
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
  },

  // Desde acá corre el plazo para pagar una reserva pendiente
  createdReserve: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },

  // EFECTIVO: se paga una seña por Mercado Pago y el resto en el complejo
  paymentMethod: {
    type: DataTypes.ENUM('MERCADO_PAGO', 'EFECTIVO'),
    allowNull: false,
    defaultValue: 'MERCADO_PAGO'
  },

  depositAmount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  // Cuándo y quién registró el cobro del resto en efectivo
  cashPaidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },

  cashRegisteredBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'idUser'
    }
  }
}, {
    tableName: "Reservas",
    timestamps: false
});