import { DataTypes } from 'sequelize';
import db from '../config/database.js';
import Cancha from './Cancha.js'; // Importamos el modelo de Cancha
import Usuario from './Usuario.js'; // Importamos el modelo de Usuario
import Horario from './Horario.js'; // Importamos el modelo de Horario
import Servicio from './Servicio.js'; // Importamos el modelo de Servicio

const Reserve = sequelize.define("Reserva", {
dateReserve: {
        type: DataTypes.DATEONLY,   // Solo fecha, sin hora (ej: "2025-06-15")
        allowNull: false
    },
    
    monto_total: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

    stateReserva: {
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

    horario_id: {
        type: DataTypes.INTEGER,
        allowNull:false,
        references: {
          model: Horario, // Apunta a la tabla de Horarios
          key: 'id'
        
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

// Una reserva pertenece a un usuario
Reserva.belongsTo(Usuario, { foreignKey: 'usuario_id' });

// Un usuario puede tener muchas reservas
Usuario.hasMany(Reserva, { foreignKey: 'usuario_id' });

// Una reserva pertenece a una cancha
Reserva.belongsTo(Cancha, { foreignKey: 'cancha_id' });

// Una cancha puede tener muchas reservas
Cancha.hasMany(Reserva, { foreignKey: 'cancha_id' });

//Una reserva puede tener un servicio (opcional)
Reserva.belongsToMany(Servicio, { through: 'ReservaServicio', foreignKey: 'reserva_id' });

//Una reserva solo tiene un horario
Reserva.belongsTo(Horario, { foreignKey: 'horario_id' });

//Un horario puede tener muchas reservas
Horario.hasMany(Reserva, { foreignKey: 'horario_id' });

export default Reserve;

