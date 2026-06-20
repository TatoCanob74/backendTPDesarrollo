import { DataTypes } from 'sequelize';
import db from '../config/database.js';
import { Reserve } from './reserva.js';

const Service = sequelize.define("Servicios", {
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
    timestamps: true
});

//Un servicio puede estar en muchas reservas
Servicio.belongsToMany(Reserva, { through: 'ReservaServicio', foreignKey: 'servicio_id' });
export default Servicio;