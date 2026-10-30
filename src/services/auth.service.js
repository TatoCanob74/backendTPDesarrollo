import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { DateTime } from "luxon";
import { User } from "../models/user.js";
import { HttpError } from "../utils/httpError.js";
import { generateCode, verifyCode, findLastActiveCode } from "./code.service.js";
import { codeSend } from "./mail.service.js";
import { findUserByEmail, withoutPassword } from "./usuario.service.js";

const RESEND_COOLDOWN_SECONDS = 60;

export const registerUser = async ({ nameUser, surnameUser, emailUser, dateUser, passwordUser, aliasUser }) => {
  if (await findUserByEmail(emailUser)) {
    throw new HttpError(400, "El mail ya está registrado.");
  }

  const passwordHash = await bcrypt.hash(passwordUser, 10);

  const newUser = await User.create({
    nameUser,
    surnameUser,
    emailUser,
    dateUser,
    typeUser: "CLIENTE",
    passwordUser: passwordHash,
    aliasUser,
    stateUser: "ACTIVO"
  });

  const code = await generateCode(newUser.idUser, "REGISTRO");

  // El usuario ya quedó creado: si el mail falla se responde 201 igual y puede pedir otro código con /auth/resend
  let message = `Te enviamos un código a ${emailUser}.`;
  try {
    await codeSend(emailUser, code, "REGISTRO", 10);
  } catch (error) {
    console.error("Error al enviar el código de registro:", error);
    message = "El usuario se creó pero no se pudo enviar el mail. Pedí un código nuevo.";
  }

  return { message, user: withoutPassword(newUser) };
};

export const verifyUserEmail = async (emailUser, code) => {
  const user = await findUserByEmail(emailUser);

  if (!user) {
    throw new HttpError(400, "Código o usuario inválido.");
  }

  if (user.verifiedUser === true) {
    throw new HttpError(400, "Usuario ya verificado.");
  }

  await verifyCode(user.idUser, "REGISTRO", code);

  user.verifiedUser = true;
  await user.save();
};

// No avisa si la cuenta existe o no (evita User Enumeration): el controller responde siempre lo mismo
export const resendVerificationCode = async (emailUser) => {
  const user = await findUserByEmail(emailUser);

  if (!user || user.verifiedUser === true) return;

  const ultCode = await findLastActiveCode(user.idUser, "REGISTRO");
  if (ultCode) {
    const diffInSeconds = DateTime.now().diff(DateTime.fromJSDate(ultCode.createdAt), "seconds").seconds;
    if (diffInSeconds < RESEND_COOLDOWN_SECONDS) return;
  }

  const code = await generateCode(user.idUser, "REGISTRO");

  try {
    await codeSend(emailUser, code, "REGISTRO", 10);
  } catch (error) {
    // Si el mail falla solo se loguea: avisarle al usuario rompería la regla del mensaje genérico
    console.error("Error al reenviar el código por email:", error);
  }
};

// Devuelve el JWT si las credenciales son válidas
export const loginUser = async (emailUser, passwordUser) => {
  const user = await findUserByEmail(emailUser);
  if (!user) {
    throw new HttpError(401, "Credenciales inválidas");
  }

  if (user.stateUser === "INACTIVO") {
    throw new HttpError(403, "Tu cuenta está desactivada. Contactá al administrador.");
  }

  const validate = await bcrypt.compare(passwordUser, user.passwordUser);
  if (!validate) {
    throw new HttpError(401, "Credenciales inválidas");
  }

  if (user.verifiedUser === false) {
    throw new HttpError(403, "Debes verificar tu email para iniciar sesión.", "EMAIL_NO_VERIFICADO");
  }

  return jwt.sign(
    { idUser: user.idUser, emailUser: user.emailUser, typeUser: user.typeUser },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

// Igual que el reenvío: no revela si el email está registrado
export const requestPasswordReset = async (emailUser) => {
  const user = await findUserByEmail(emailUser);

  if (!user || user.stateUser === "INACTIVO") return;

  const code = await generateCode(user.idUser, "RECUPERACION");

  try {
    await codeSend(emailUser, code, "RECUPERACION", 10);
  } catch (error) {
    console.error("Error al reenviar el código por email:", error);
  }
};

export const resetPassword = async (emailUser, code, newPassword) => {
  const user = await findUserByEmail(emailUser);

  if (!user) {
    throw new HttpError(400, "Código o usuario inválido.");
  }

  await verifyCode(user.idUser, "RECUPERACION", code);

  user.passwordUser = await bcrypt.hash(newPassword, 10);
  await user.save();
};
