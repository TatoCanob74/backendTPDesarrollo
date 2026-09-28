import bcrypt  from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, emailUser as findUserByEmail } from "../models/user.js";
import { validateNewUser } from "../utils/userValidation.js";
import { sendError } from "../utils/httpError.js";

export const register = async (req, res) => {
  try {
    const {nameUser, surnameUser, emailUser, dateUser, passwordUser, aliasUser} = req.body;

    const validationError = validateNewUser(req.body);
    if (validationError) {
      return res.status(400).json({error: validationError});
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

    const { passwordUser: _hash, ...userWithoutPassword } = newUser.toJSON();
    res.status(201).json(userWithoutPassword)
  } catch (error) {
    sendError(res, error);
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
      { expiresIn: "1h" }
    );

    return res.json({ token });
  } catch (error) {
    sendError(res, error);
  }
};

export default register;
