import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Reserve } from './Reserva.js';
import { reserveService } from './ReservaServicio.js';

export const Service = sequelize.define("Servicios", {
    idService: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    nameService: {
      type: DataTypes.STRING,
      allowNull: false
    },

    priceService: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },

    descriptionService : {
      type: DataTypes.STRING,
      allowNull: false
    }

}, {
    tableName: "Servicio",
    timestamps: false
});


