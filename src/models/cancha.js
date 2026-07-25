import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Location } from "./localidad.js";

export const Court = sequelize.define("Cancha", {
  idCourt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  typeCourt: {
    type: DataTypes.ENUM('FUTBOL', 'TENIS', 'PADEL'),
    allowNull: false
  },
  nameCourt: {
    type: DataTypes.STRING,
    allowNull: false
  },
  hourlyPrice: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: false
  },
  stateCourt: {
    type: DataTypes.ENUM('DISPONIBLE', 'OCUPADO'),
    allowNull: false
  },
  capacityPlayers: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  idLocateCourt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Location,
      key: 'idLocation'
    }
  }
}, {
  tableName: "Cancha",
  timestamps: false
});

Court.belongsTo(Location, { foreignKey: 'idLocateCourt' });
Location.hasMany(Court, { foreignKey: 'idLocateCourt' });

export default Court;
