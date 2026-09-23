const BIRTH_DATE_REGEX = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export const MIN_AGE = 16;
export const MAX_AGE = 120;

export const parseBirthDate = (value) => {
  const match = BIRTH_DATE_REGEX.exec(String(value ?? "").trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  // Date.UTC corrige las fechas que no existen (31/02 -> 03/03)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

const todayUTC = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

export const ageFromBirthDate = (birthDate) => {
  const today = todayUTC();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();

  const cumpleTodavíaNoPasó =
    today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() < birthDate.getUTCDate());

  if (cumpleTodavíaNoPasó) age -= 1;

  return age;
};

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
