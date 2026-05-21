import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const Usuario = sequelize.define("Usuarios", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: { 
    type: DataTypes.STRING,
    allowNull: false,
    validate:{
      notEmpty: {msg: "El nombre no puede estar vacío."}
  }
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false,
    validate:{
     notEmpty: {msg: "El apellido no puede estar vacío."}
  }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: {msg: "El email no es válido."},
      notEmpty: {msg: "El mensaje no puede estar vacío."}
    }
  },
  fechaNacimiento: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: {
        args: /^\d{2}\/\d{2}\/\d{4}$/,
        msg: "La fecha de nacimiento debe tener el formato dd/mm/aaaa"
      }
    }
  },
  tipo: {
    type: DataTypes.ENUM('ADMIN', 'CLIENTE'),
    allowNull: false
  },
  contraseña: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {msg: "La contraseña no puede estar vacía."},
      len: {args: [8, 100], msg: "La contraseña debe tener al menos 8 caracteres."}
    }
  },
  nomusuario: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {msg: "El nombre de usuario no puede estar vacío."}
    }
  }
}, {
  tablename: "usuarios",
  timestamps: false
});

export const emailUsuario = async (email) => {
  try {
    const usuario = await Usuario.findOne({ where: { email }});
    return usuario;
  } catch {error} {
    console.log(error);
  }
};



export default Usuario;

