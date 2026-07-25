import { Court } from "../models/cancha.js";

export const seeCourts = async (req, res) => {
  try {
    const filters = { stateCourt: 'DISPONIBLE' };
    if (req.query.typeCourt) {
      filters.typeCourt = req.query.typeCourt;
    }
    const courts = await Court.findAll({
      where: filters
    });
    res.status(200).json(courts);
  } catch (error) {
    res.status(500).json({ error });
  }
};
