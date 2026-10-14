import { validateBirthDate } from "./birthDate.js";
import { validarTextos } from "./validators.js";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

// Validaciones compartidas por el registro público y el alta de admins que hace el superadmin.
// Devuelve el mensaje de error, o null si los datos están bien.
export const validateNewUser = ({ nameUser, surnameUser, emailUser, dateUser, passwordUser, aliasUser }) => {
  if (!nameUser || !surnameUser || !emailUser || !dateUser || !passwordUser || !aliasUser) {
    return "Todos los campos son obligatorios";
  }

  // Los controllers hacen .trim() y bcrypt.hash: con un número en vez de texto romperían con un 500
  const errorTexto = validarTextos({ nombre: nameUser, apellido: surnameUser, alias: aliasUser });
  if (errorTexto) {
    return errorTexto;
  }

  if (typeof emailUser !== "string" || !EMAIL_REGEX.test(emailUser)) {
    return "El email no tiene un formato válido.";
  }

  // El modelo valida la longitud sobre el hash (siempre 60 caracteres), no sobre la contraseña
  if (typeof passwordUser !== "string" || passwordUser.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  return validateBirthDate(dateUser);
};
