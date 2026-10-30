import { validate } from "../validate.js";
import { validateBirthDate } from "../../utils/birthDate.js";
import { validarTextos } from "../../utils/validators.js";
import { validateNewUser } from "../../utils/userValidation.js";

export const validateProfileUpdate = validate(({ body = {} }) => {
  const { nameUser, surnameUser, dateUser, aliasUser } = body;

  if (!nameUser || !surnameUser || !dateUser || !aliasUser) {
    return "Todos los campos son obligatorios.";
  }

  return validarTextos({ nombre: nameUser, apellido: surnameUser, alias: aliasUser }) ?? validateBirthDate(dateUser);
});

// El alta de admins que hace el superadmin usa las mismas reglas que el registro público
export const validateNewAdmin = validate(({ body = {} }) => validateNewUser(body));
