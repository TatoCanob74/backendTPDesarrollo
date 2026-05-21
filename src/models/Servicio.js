import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Reserva from './reserva.js';

const Servicio = sequelize.define("Servicios", {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },

    precio: {
      type: DataTypes.FLOAT,
      allowNull: false
    },

}, {
    timestamps: true
});

//Un servicio puede estar en muchas reservas
Servicio.belongsToMany(Reserva, { through: 'ReservaServicio', foreignKey: 'servicio_id' });
export default Servicio;