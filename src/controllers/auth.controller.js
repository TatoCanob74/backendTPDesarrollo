import bcrypt  from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, emailUser as findUserByEmail } from "../models/usuarios.js";
import { validateBirthDate } from "../utils/birthDate.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export const register = async (req, res) => {
  try {
    const {nameUser, surnameUser, emailUser, dateUser, passwordUser, aliasUser} = req.body;

    // Las validaciones van antes de hashear: si faltaba la contraseña, bcrypt
    // rompía con un 500 en lugar de responder "todos los campos son obligatorios".
    if (!nameUser || !surnameUser || !emailUser || !dateUser || !passwordUser || !aliasUser){
      return res.status(400).json({error :"Todos los campos son obligatorios"});
    }

    if (!EMAIL_REGEX.test(emailUser)) {
      return res.status(400).json({error :"El email no tiene un formato válido."});
    }

    // El modelo valida la longitud sobre el hash (siempre 60 caracteres), así que
    // la contraseña real hay que medirla acá.
    if (passwordUser.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({error : `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`});
    }

    const birthDateError = validateBirthDate(dateUser);
    if (birthDateError) {
      return res.status(400).json({error: birthDateError});
    }

    const userExists = await findUserByEmail(emailUser);
    if (userExists){
      return res.status(400).json({error: "El mail ya está registrado."})
    }

    const passwordHash = await bcrypt.hash(passwordUser, 10);

    const newUser = await User.create({
      nameUser,
      surnameUser,
      emailUser,
      dateUser,
      typeUser: 'CLIENTE',
      passwordUser: passwordHash,
      aliasUser,
      stateUser: "ACTIVO"
    })

    // Nunca devolver el hash de la contraseña en la respuesta
    const { passwordUser: _hash, ...userWithoutPassword } = newUser.toJSON();
    res.status(201).json(userWithoutPassword)
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const login = async (req, res) => {
  try {
    const { emailUser, passwordUser } = req.body;

    if (!emailUser || !passwordUser) {
      return res.status(422).json({ message: "Email y contraseña requeridos" });
    }

    const user = await findUserByEmail(emailUser);
    if (!user) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    if (user.stateUser === 'INACTIVO') {
      return res.status(403).json({ message: "Tu cuenta está desactivada. Contactá al administrador." });
    }

    const validate = await bcrypt.compare(passwordUser, user.passwordUser);
    if (!validate) {
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { idUser: user.idUser, emailUser: user.emailUser, typeUser: user.typeUser },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default register;
