import { validate } from "../validate.js";
import { validateNewUser, EMAIL_REGEX, MIN_PASSWORD_LENGTH } from "../../utils/userValidation.js";

const CODE_REGEX = /^\d{6}$/;

const emailError = (emailUser) => (EMAIL_REGEX.test(emailUser) ? null : "Formato inválido de email.");
const codeError = (code) => (CODE_REGEX.test(code) ? null : "Formato inválido de código.");

export const validateRegister = validate(({ body = {} }) => validateNewUser(body));

export const validateVerifyEmail = validate(({ body = {} }) =>
  emailError(body.emailUser) ?? codeError(body.code)
);

export const validateEmailOnly = validate(({ body = {} }) => emailError(body.emailUser));

export const validateLogin = validate(
  ({ body = {} }) => (!body.emailUser || !body.passwordUser ? "Email y contraseña requeridos" : null),
  { status: 422, key: "message" }
);

export const validateResetPassword = validate(({ body = {} }) => {
  const { emailUser, code, newPassword } = body;

  const formatError = emailError(emailUser) ?? codeError(code);
  if (formatError) return formatError;

  if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
    return "No cumple con la cantidad mínima de caracteres.";
  }
  return null;
});
