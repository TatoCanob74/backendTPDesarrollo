import { DataTypes } from 'sequelize';
import db from '../config/database.js';
import Cancha from './Cancha.js'; // Importamos el modelo de Cancha
import Usuario from './Usuario.js'; // Importamos el modelo de Usuario

const Reserva = db.define('reserva', {
fecha: {
        type: DataTypes.DATEONLY,   // Solo fecha, sin hora (ej: "2025-06-15")
        allowNull: false
    },

    hora_inicio: {
        type: DataTypes.TIME,       // Solo hora (ej: "10:00:00")
        allowNull: false
    },

    hora_fin: {
        type: DataTypes.TIME,
        allowNull: false
    },

    estado: {
        type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada'), // Solo acepta estos valores
        allowNull: false,
        defaultValue: 'pendiente'   // Si no se especifica, arranca como "pendiente"
    },

    // 🔑 Claves foráneas — enlazan con otras tablas
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Usuario,         // Apunta a la tabla de Usuarios
            key: 'id'              // Específicamente al campo "id"
        }
    },

    cancha_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Cancha,          // Apunta a la tabla de Canchas
            key: 'id'
        }
    }

}, {
    timestamps: true
});

// ─────────────────────────────────────────
// Asociaciones (le decimos a Sequelize cómo se relacionan los modelos)
// ─────────────────────────────────────────

// Una reserva pertenece a un usuario
Reserva.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Un usuario puede tener muchas reservas
Usuario.hasMany(Reserva, { foreignKey: 'usuario_id' });

// Una reserva pertenece a una cancha
Reserva.belongsTo(Cancha, { foreignKey: 'cancha_id' });

// Una cancha puede tener muchas reservas
Cancha.hasMany(Reserva, { foreignKey: 'cancha_id' });

export default Reserva;