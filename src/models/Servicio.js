import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
<<<<<<< HEAD
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

=======

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
  descriptionService: {
    type: DataTypes.STRING,
    allowNull: false
  }
>>>>>>> origin/santy
}, {
<<<<<<< HEAD
  timestamps: true
});
<<<<<<< HEAD
=======

export default Service;
>>>>>>> origin/santy
=======
    tableName: "Servicio",
    timestamps: false
});


>>>>>>> origin/rama/Francisco
