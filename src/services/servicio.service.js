import { Service } from "../models/service.js";
import { reserveService } from "../models/reserveService.js";
import { HttpError } from "../utils/httpError.js";

const findServiceOrFail = async (idService) => {
  const service = await Service.findByPk(idService);
  if (!service) {
    throw new HttpError(404, "Servicio no encontrado.");
  }
  return service;
};

export const listServices = () => Service.findAll();

export const createService = ({ nameService, priceService, descriptionService }) =>
  Service.create({
    nameService: String(nameService).trim(),
    priceService,
    descriptionService: String(descriptionService).trim()
  });

export const updateService = async (idService, { nameService, priceService, descriptionService }) => {
  const service = await findServiceOrFail(idService);
  await service.update({ nameService: nameService?.trim(), priceService, descriptionService: descriptionService?.trim() });
  return service;
};

export const deleteService = async (idService) => {
  const service = await findServiceOrFail(idService);

  const usosDelServicio = await reserveService.count({ where: { idService } });
  if (usosDelServicio > 0) {
    throw new HttpError(409, "No se puede eliminar: el servicio está asociado a reservas existentes.");
  }

  await service.destroy();
};
