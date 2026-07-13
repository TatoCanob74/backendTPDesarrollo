import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Court } from './cancha.js';
import { User } from './usuarios.js';
import { Horary } from './Horario.js';
import Service from './Servicio.js';
import ReserveService from './ReserveService.js';

export const Reserve = sequelize.define("Reserva", {
  idReserve: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  dateReserve: {
    type: DataTypes.DATEONLY,   // Solo fecha, sin hora (ej: "2025-06-15")
    allowNull: false
  },

  totalAmount: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: false
  },

  stateReserva: {
    type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada'),
    allowNull: false,
    defaultValue: 'pendiente'
  },

  // Datos del pago en MercadoPago
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },

  paymentStatus: {
    type: DataTypes.STRING,   // approved, rejected, pending, etc.
    allowNull: true
  },

  // Claves foráneas

  idUser: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'idUser'
    }
  },

  idHorary: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Horary,
      key: 'idHorary'
    }
  },

  idCourt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Court,
      key: 'idCourt'
    }
  }

}, {
  timestamps: true
});

// Una reserva pertenece a un usuario
Reserve.belongsTo(User, { foreignKey: 'idUser' });
User.hasMany(Reserve, { foreignKey: 'idUser' });

// Una reserva pertenece a una cancha
Reserve.belongsTo(Court, { foreignKey: 'idCourt' });
Court.hasMany(Reserve, { foreignKey: 'idCourt' });

// Una reserva pertenece a un horario
Reserve.belongsTo(Horary, { foreignKey: 'idHorary' });
Horary.hasMany(Reserve, { foreignKey: 'idHorary' });

// Una reserva puede tener varios servicios (opcional)
Reserve.belongsToMany(Service, { through: ReserveService, foreignKey: 'idReserve', otherKey: 'idService' });
Service.belongsToMany(Reserve, { through: ReserveService, foreignKey: 'idService', otherKey: 'idReserve' });

export default Reserve;
