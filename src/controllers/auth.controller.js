import bcrypt  from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, emailUser as findUserByEmail } from "../models/usuarios.js";

export const register = async (req, res) => {
  try {
    const {nameUser, surnameUser, emailUser, dateUser, typeUser, passwordUser, aliasUser} = req.body;

    const userExists = await findUserByEmail(emailUser);
    if (userExists){
      return res.status(400).json({error: "El mail ya está registrado."})
    }

    const passwordHash = await bcrypt.hash(passwordUser, 10);

    if (!nameUser || !surnameUser || !emailUser || !dateUser || !typeUser || !passwordUser || !aliasUser){
      return res.status(400).json({error :"Todos los campos son obligatorios"});
    }
 
    if (!emailUser.includes("@")) {
      return res.status(400).json({error :"El email no contiene el arroba"});
    }

    const newUser = await User.create({
      nameUser,
      surnameUser,
      emailUser,
      dateUser,
      typeUser,
      passwordUser: passwordHash,
      aliasUser,
      stateUser: "ACTIVO"
    })
    res.status(201).json(newUser)
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const login = async (req, res) => {
  const { emailUser, passwordUser} = req.body;

  if(!emailUser ||!passwordUser) {
    return res.status(422).json({message: "Email y contraseña requeridos"});
  }

  const user = await findUserByEmail(emailUser);
  if (!user) {
    return res.status(401).json({message: "Credenciales inválidas"});
  };

   if (user.stateUser === 'INACTIVO') {
      return res.status(403).json({ message: "Tu cuenta está desactivada. Contactá al administrador." });
    }

  const validate = await bcrypt.compare(passwordUser, user.passwordUser);
  if(!validate) {
    return res.status(401).json({message: "Credenciales inválidas"});
  }

  const token = jwt.sign(
    { idUser: user.idUser, emailUser: user.emailUser, typeUser: user.typeUser},
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
    }
  );
  return res.json({ token });
};

export default register;
 


