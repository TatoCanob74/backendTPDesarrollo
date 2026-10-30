import { sendError } from "../utils/httpError.js";
import {
  registerUser, verifyUserEmail, resendVerificationCode, loginUser, requestPasswordReset, resetPassword as resetUserPassword
} from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    sendError(res, error);
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { emailUser, code } = req.body;
    await verifyUserEmail(emailUser, code);
    res.status(200).json({ message: "Usuario verificado." });
  } catch (error) {
    sendError(res, error);
  }
};

export const resendCode = async (req, res) => {
  try {
    await resendVerificationCode(req.body.emailUser);
    // Mensaje genérico para evitar User Enumeration
    res.status(200).json({ message: "Si la cuenta existe y no está verificada, te enviamos un código." });
  } catch (error) {
    sendError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    const { emailUser, passwordUser } = req.body;
    const token = await loginUser(emailUser, passwordUser);
    res.json({ token });
  } catch (error) {
    sendError(res, error);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    await requestPasswordReset(req.body.emailUser);
    res.status(200).json({ message: "Si el email está registrado, te enviamos un código." });
  } catch (error) {
    sendError(res, error);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { emailUser, code, newPassword } = req.body;
    await resetUserPassword(emailUser, code, newPassword);
    res.status(200).json({ message: "Contraseña cambiada con éxito." });
  } catch (error) {
    sendError(res, error);
  }
};

export default register;
