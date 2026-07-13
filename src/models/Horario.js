import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Court } from './cancha.js';

export const Horary = sequelize.define("Horarios", {
  idHorary: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: false
  },
<<<<<<< HEAD

=======
>>>>>>> origin/santy
  idCourt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Court,
      key: 'idCourt'
    }
  },
<<<<<<< HEAD

=======
>>>>>>> origin/santy
  startTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
<<<<<<< HEAD

=======
>>>>>>> origin/santy
  endTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
<<<<<<< HEAD

=======
>>>>>>> origin/santy
  day: {
    type: DataTypes.ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'),
    allowNull: false
  }
<<<<<<< HEAD
});{
  tableName: "Horarios";
  timestamps: false; //Le dice a Sequelize si tiene que agregar automáticamente las columnas createdAt y 
                    //updateAt a la tabla.
=======
}, {
  tableName: "Horarios",
  timestamps: false,
>>>>>>> origin/santy
  indexes: [
    {
      unique: true,
      fields: ['idCourt', 'day', 'startTime']
    }
  ]
<<<<<<< HEAD
};

export default Horary;
=======
});

Horary.belongsTo(Court, { foreignKey: 'idCourt' });
Court.hasMany(Horary, { foreignKey: 'idCourt' });

export default Horary;
>>>>>>> origin/santy
