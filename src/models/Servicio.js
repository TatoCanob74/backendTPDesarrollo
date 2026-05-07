import { DataTypes } from 'sequelize';
import db from '../config/database.js';

const Servicio = db.define('servicio', {
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

Servicio.belongsToMany(Servicio, { through: 'ReservaServicio' });

export default Servicio;