// Validación de la fecha de nacimiento.
//
// La base guarda `dateUser` como string "dd/mm/aaaa", así que la validación
// trabaja sobre ese formato. La comparten el registro y la edición de perfil
// para que las dos pantallas apliquen exactamente las mismas reglas.

const BIRTH_DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export const MIN_AGE = 16;
export const MAX_AGE = 120;

/** "24/07/2004" → Date (UTC), o null si no es una fecha real del calendario. */
export const parseBirthDate = (value) => {
  const match = BIRTH_DATE_REGEX.exec(String(value ?? "").trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  // Date.UTC "corrige" fechas inexistentes (31/02 pasa a ser 03/03), así que se
  // compara el resultado contra lo ingresado para descartarlas.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

/** Fecha de hoy sin hora, en UTC, para comparar contra la fecha de nacimiento. */
const todayUTC = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

/** Años cumplidos al día de hoy. */
export const ageFromBirthDate = (birthDate) => {
  const today = todayUTC();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();

  const cumpleTodavíaNoPasó =
    today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() < birthDate.getUTCDate());

  if (cumpleTodavíaNoPasó) age -= 1;

  return age;
};

/**
 * Valida la fecha de nacimiento.
 * Devuelve el mensaje de error para mostrarle al usuario, o null si está bien.
 */
export const validateBirthDate = (value) => {
  if (!value) {
    return "La fecha de nacimiento es obligatoria.";
  }

  const birthDate = parseBirthDate(value);
  if (!birthDate) {
    return "La fecha de nacimiento no es válida. Usá el formato dd/mm/aaaa.";
  }

  if (birthDate > todayUTC()) {
    return "La fecha de nacimiento no puede ser una fecha futura.";
  }

  const age = ageFromBirthDate(birthDate);

  if (age < MIN_AGE) {
    return `Tenés que tener al menos ${MIN_AGE} años.`;
  }

  if (age > MAX_AGE) {
    return "Revisá la fecha de nacimiento: el año ingresado no es válido.";
  }

  return null;
};
