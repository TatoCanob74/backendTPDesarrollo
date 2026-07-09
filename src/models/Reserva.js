import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Court } from './cancha.js'; // Importamos el modelo de Cancha
import { User } from './usuarios.js'; // Importamos el modelo de Usuario
import { Horary } from './Horario.js'; // Importamos el modelo de Horario
import { Service } from './Servicio.js'; // Importamos el modelo de Servicio

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
        type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada'), // Solo acepta estos valores
        allowNull: false,
        defaultValue: 'pendiente'   // Si no se especifica, arranca como "pendiente"
    },  

    idUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,         // Apunta a la tabla de Usuarios
            key: 'idUser'              // Específicamente al campo "id"
        }
    },

    idCourt: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Court,          // Apunta a la tabla de Canchas
            key: 'idCourt'
        }
    }

}, {
    timestamps: true
});

export default Reserve;

