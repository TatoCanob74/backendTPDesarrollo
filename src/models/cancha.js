import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Location } from "./localidad.js";

export const Court = sequelize.define("Cancha", {
  idCourt: {
    type: DataTypes.INTEGER,
<<<<<<< HEAD
    allowNull : false,
    primaryKey: true,
    unique: true
  },

=======
    allowNull: false,
    unique: true
  },
>>>>>>> origin/santy
  typeCourt: {
    type: DataTypes.ENUM('FUTBOL', 'TENIS', 'PADEL'),
    allowNull: false
  },
<<<<<<< HEAD

=======
>>>>>>> origin/santy
  nameCourt: {
    type: DataTypes.STRING,
    allowNull: false
  },
<<<<<<< HEAD

=======
>>>>>>> origin/santy
  hourlyPrice: {
    type: DataTypes.DECIMAL(7, 2),
    allowNull: false
  },
<<<<<<< HEAD

=======
>>>>>>> origin/santy
  stateCourt: {
    type: DataTypes.ENUM('DISPONIBLE', 'OCUPADO'),
    allowNull: false
  },
<<<<<<< HEAD

=======
>>>>>>> origin/santy
  capacityPlayers: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
<<<<<<< HEAD

=======
>>>>>>> origin/santy
  idLocateCourt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "idLocateCourt",
    references: {
      model: Location,
      key: 'idLocation'
    }
  }
<<<<<<< HEAD
<<<<<<< HEAD
}); {
  tableName: "Cancha";
  timestamps: false;
}
=======
}, {
  tableName: "Canchas",
  timestamps: false
});
>>>>>>> origin/rama/Francisco

export default Court;
=======
}, {
  tableName: "Cancha",
  timestamps: false
});

Court.belongsTo(Location, { foreignKey: 'idLocateCourt' });
Location.hasMany(Court, { foreignKey: 'idLocateCourt' });

export default Court;
>>>>>>> origin/santy
