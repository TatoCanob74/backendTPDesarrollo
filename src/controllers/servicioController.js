import { Service } from "../models/Servicio.js";
import { reserveService } from "../models/ReservaServicio.js";

export const seeServices = async (req, res) => {
  try {
    const services = await Service.findAll();
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const { nameService, priceService, descriptionService } = req.body;

    if (!nameService || !priceService || !descriptionService) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    if (!Number.isInteger(Number(priceService)) || Number(priceService) <= 0) {
      return res.status(400).json({ error: "El precio del servicio debe ser un número entero mayor a 0." });
    }

    const newService = await Service.create({ nameService, priceService, descriptionService });
    res.status(201).json(newService);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { nameService, priceService, descriptionService } = req.body;

    if (priceService !== undefined && (!Number.isInteger(Number(priceService)) || Number(priceService) <= 0)) {
      return res.status(400).json({ error: "El precio del servicio debe ser un número entero mayor a 0." });
    }

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ error: "Servicio no encontrado." });
    }

    await service.update({ nameService, priceService, descriptionService });
    res.status(200).json({ message: "Servicio actualizado exitosamente.", service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findByPk(id);
    if (!service) {
      return res.status(404).json({ error: "Servicio no encontrado." });
    }

    const usosDelServicio = await reserveService.count({ where: { idService: id } });
    if (usosDelServicio > 0) {
      return res.status(409).json({ error: "No se puede eliminar: el servicio está asociado a reservas existentes." });
    }

    await service.destroy();
    res.status(200).json({ message: "Servicio eliminado exitosamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};