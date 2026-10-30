import { Location } from "../models/location.js";
import { Complex } from "../models/complex.js";
import { HttpError } from "../utils/httpError.js";

const findLocationOrFail = async (idLocation) => {
  const location = await Location.findByPk(idLocation);
  if (!location) {
    throw new HttpError(404, "Localidad no encontrada.");
  }
  return location;
};

export const listLocations = () => Location.findAll();

export const createLocation = ({ nameCountry, nomLocation }) =>
  Location.create({
    nameCountry: String(nameCountry).trim(),
    nomLocation: String(nomLocation).trim()
  });

export const updateLocation = async (idLocation, { nameCountry, nomLocation }) => {
  const location = await findLocationOrFail(idLocation);
  await location.update({ nameCountry: nameCountry?.trim(), nomLocation: nomLocation?.trim() });
  return location;
};

export const deleteLocation = async (idLocation) => {
  const location = await findLocationOrFail(idLocation);

  const complejosDeLaLocalidad = await Complex.count({ where: { idLocation } });
  if (complejosDeLaLocalidad > 0) {
    throw new HttpError(409, "No se puede eliminar: la localidad tiene complejos asociados.");
  }

  await location.destroy();
};
