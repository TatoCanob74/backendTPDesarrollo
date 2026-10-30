// Fecha "AAAA-MM-DD" a medianoche UTC: así se comparan días sin que moleste la zona horaria
export const dateFromISO = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

// El día de hoy del servidor, también a medianoche UTC, para compararlo con dateFromISO
export const todayUTC = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

// MySQL compara los TIME en formato "HH:MM:SS"
export const normalizeTime = (time) => {
  const [hours, minutes, seconds] = time.split(":");
  return `${hours.padStart(2, "0")}:${minutes}:${seconds ?? "00"}`;
};
