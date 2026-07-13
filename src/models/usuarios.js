import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const User = sequelize.define("Usuarios", {
  idUser: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nameUser: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "El nombre no puede estar vacío." }
    }
  },
  surnameUser: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "El apellido no puede estar vacío." }
    }
  },
  emailUser: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: { msg: "El email no es válido." },
      notEmpty: { msg: "El email no puede estar vacío." }
    }
  },
  dateUser: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: {
        args: /^\d{2}\/\d{2}\/\d{4}$/,
        msg: "La fecha de nacimiento debe tener el formato dd/mm/aaaa"
      }
    }
  },
  typeUser: {
    type: DataTypes.ENUM('ADMIN', 'CLIENTE'),
    allowNull: false
  },
  passwordUser: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: "La contraseña no puede estar vacía." },
      len: { args: [8, 100], msg: "La contraseña debe tener al menos 8 caracteres." }
    }
  },
  aliasUser: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "El nombre de usuario no puede estar vacío." }
    }
  }
}, {
  tableName: "Usuarios",
  timestamps: false
});

export const emailUser = async (email) => {
  try {
    const user = await User.findOne({ where: { emailUser: email } });
    return user;
  } catch (error) {
    console.log(error);
  }
};

export default User;
