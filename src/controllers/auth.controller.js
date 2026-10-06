import bcrypt  from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, emailUser as findUserByEmail } from "../models/user.js";
import { validateNewUser, EMAIL_REGEX, MIN_PASSWORD_LENGTH } from "../utils/userValidation.js";
import { HttpError, sendError } from "../utils/httpError.js";
import { generateCode, verifyCode } from "../services/code.service.js";
import { codeSend }from "../services/mail.service.js;"
import Verification from "../models/verificationCode.js";
import { use } from "react";

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

    const code = await generateCode(idUser, 'REGISTRO')

    try {
    const mail = await codeSend(emailUser, code, 'REGISTRO', 10)

    if(mail){
      res.status(201).json({ message: "Te enviamos un código a tu email:" `emailUser` });
    }

    } catch (error) {
      res.status(201).json({ message: "El usuario se creó pero no se envío el mail."})
    }

    const { passwordUser: _hash, ...userWithoutPassword } = newUser.toJSON();
    res.status(201).json(userWithoutPassword)
  } catch (error) {
    sendError(res, error);
  }
};

export const verifyEmail = async(req, res) => {
  try {
    const {emailUser, code} = req.body;

    if(!EMAIL_REGEX.test(emailUser)){
      throw new HttpError(400, 'Formato inválido de email.')
    }

    if(!/^\d{6}$/.test(code)){
      throw new HttpError(400, 'Formato inválido de código.')
    }

    const userEmail = await User.findOne({
      where: {
      emailUser: emailUser
      }
    });

    if(!userEmail){
      throw new HttpError(400, 'Código o usuario inválido.');
    };

    if(userEmail.verifiedUser === true){
      throw new HttpError(400, 'Usuario ya verificado.');
    };

    const id = userEmail.idUser;

    const verify = await verifyCode(id, 'REGISTRO', code);

    userEmail.verifiedUser = true;
    
    await userEmail.save();

    res.status(200).json({ message: "Usuario verificado."});

  } catch (error) {
    sendError(res, error);
  }
};

export const resendCode = async(req, res) => {
  try {
    const { emailUser } = req.body;
    
    // Mensaje genérico para evitar User Enumeration
    const GENERIC_MESSAGE = "Si la cuenta existe y no está verificada, te enviamos un código.";

    const user = await User.findOne({
      where: {
        emailUser: emailUser
      }
    });

    // Si el usuario no existe o ya está verificado, devolvemos el 200 genérico y cortamos la ejecución.
    if (!user || user.verifiedUser === true) {
      return res.status(200).json({ message: GENERIC_MESSAGE });
    }

    const ultCode = await Verification.findOne({
      where: {
        idUser: user.idUser,
        purposeCode: 'REGISTRO',
        usedCode: false
      },
      order: [['createdAt', 'DESC']]
    });

    if (ultCode) {
      const now = DateTime.now();
      const createdAt = DateTime.fromJSDate(ultCode.createdAt);
      const diffInSeconds = now.diff(createdAt, 'seconds').seconds;

      // Si pasaron menos de 60 segundos, cortamos y devolvemos el 200 genérico
      if (diffInSeconds < 60) {
        return res.status(200).json({ message: GENERIC_MESSAGE });
      }
    }

    // Generamos el código
    const code = await generateCode(user.idUser, 'REGISTRO');

    // Intentamos enviar el correo
    try {
      await codeSend(emailUser, code, 'REGISTRO', 10);
    } catch (error) {
      // Si el mail falla, solo lo logueamos en consola. 
      // No le avisamos al usuario para no romper la regla del mensaje genérico.
      console.error("Error al reenviar el código por email:", error);
    }

    // Respuesta final exitosa (siempre la misma)
    return res.status(200).json({ message: GENERIC_MESSAGE });

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

    if(user.verifiedUser === false){
      throw new HttpError(403, 'Debes verificar tu email para iniciar sesión.', 'EMAIL_NO_VERIFICADO')
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

export const forgotPassword = async (req, res) => {
  try {
    const { emailUser } = req.body;

    if(!EMAIL_REGEX.test(emailUser)){
      throw new HttpError(400, 'Formato inválido de email.')
    }
    
    const GENERIC_MESSAGE = "Si el email está registrado, te enviamos un código.";

    const user = await User.findOne({
      where: {
        emailUser: emailUser
      }
    });

    if (!user || user.stateUser === 'INACTIVO') {
      return res.status(200).json({ message: GENERIC_MESSAGE });
    }

    const code = await generateCode(user.idUser, 'RECUPERACION');

    try {
      await codeSend(emailUser, code, 'RECUPERACION', 10);
    } catch (error) {
      console.error("Error al reenviar el código por email:", error);
    }

    return res.status(200).json({ message: GENERIC_MESSAGE });
    
  } catch (error){
    sendError(res, error)
  };
};

export const resetPassword = async(req, res) => {
  try {
    const { emailUser, code, newPassword } = req.body;

    if(!EMAIL_REGEX.test(emailUser)){
      throw new HttpError(400, 'Formato inválido de email.')
    }

    if(!/^\d{6}$/.test(code)){
      throw new HttpError(400, 'Formato inválido de código.')
    }

    if(newPassword.lenght < MIN_PASSWORD_LENGTH){
      throw new HttpError(400, 'No cumple con la cantidad mínima de caracteres.')
    };

    const user = await User.findOne({
      where: {
        emailUser: emailUser
      }
    });

    if(!user){
      throw new HttpError(400, 'Código o usuario inválido.')
    };

    const verify = await verifyCode(user.idUser, 'RECUPERACION', code);

    const passwordHash = await bcrypt.hash(newPassword, 10);

    user.passwordUser = passwordHash;

    await user.save();

    res.status(200).json({ message: "Contraseña cambiada con éxito." })

  } catch (error) {
    sendError(res, error)
  };
};

export default register;
