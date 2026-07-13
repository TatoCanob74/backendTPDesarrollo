import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
<<<<<<< HEAD
import { User, emailUser } from "../models/usuarios.js";

export const register = async (req, res) => {
  try {
    const {nameUser, surnameUser, emailUser, dateUser, typeUser, passwordUser, aliasUser} = req.body;

    const userExists = await emailUsuario(emailUser);
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

=======
import { User, emailUser as findUserByEmail } from "../models/usuarios.js";

export const register = async (req, res) => {
  try {
    const { nameUser, surnameUser, emailUser, dateUser, typeUser, passwordUser, aliasUser } = req.body;

    if (!nameUser || !surnameUser || !emailUser || !dateUser || !typeUser || !passwordUser || !aliasUser) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    if (!emailUser.includes("@")) {
      return res.status(400).json({ error: "El email no contiene el arroba" });
    }

    const userExists = await findUserByEmail(emailUser);
    if (userExists) {
      return res.status(400).json({ error: "El mail ya está registrado." });
    }

    const passwordHash = await bcrypt.hash(passwordUser, 10);

>>>>>>> origin/santy
    const newUser = await User.create({
      nameUser,
      surnameUser,
      emailUser,
      dateUser,
      typeUser,
      passwordUser: passwordHash,
      aliasUser
<<<<<<< HEAD
    })
    res.status(201).json(newUser)
=======
    });
    res.status(201).json(newUser);
>>>>>>> origin/santy
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
<<<<<<< HEAD
  const { emailUser, passwordUser} = req.body;

  if(!emailUser ||!passwordUser) {
    return res.status(422).json({message: "Email y contraseña requeridos"});
  }

  const user = await emailUsuario(emailUser);
  if (!user) {
    return res.status(401).json({message: "Credenciales inválidas"});
  };

  const validate = await bcrypt.compare(passwordUser, user.passwordUser);
  if(!validate) {
    return res.status(401).json({message: "Credenciales inválidas"});
  }

  const token = jwt.sign(
    { idUser: user.idUser, emailUser: user.emailUser, typeUser: user.typeUser},
=======
  const { emailUser, passwordUser } = req.body;

  if (!emailUser || !passwordUser) {
    return res.status(422).json({ message: "Email y contraseña requeridos" });
  }

  const user = await findUserByEmail(emailUser);
  if (!user) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const validate = await bcrypt.compare(passwordUser, user.passwordUser);
  if (!validate) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const token = jwt.sign(
    { idUser: user.idUser, emailUser: user.emailUser, typeUser: user.typeUser },
>>>>>>> origin/santy
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
    }
  );
  return res.json({ token });
};

export default register;
<<<<<<< HEAD
 


=======
>>>>>>> origin/santy
