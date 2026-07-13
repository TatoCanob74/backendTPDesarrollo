import { Court } from "../models/cancha.js";
import { Horary } from "../models/Horario.js";

export const seeCourtsWithHoraries = async (req, res) => {
  try {
    const filters = { stateCourt: 'DISPONIBLE' };
    if (req.query.typeCourt) {
      filters.typeCourt = req.query.typeCourt;
    }

    const courts = await Court.findAll({
      where: filters,
      include: [
        {
          model: Horary,
          as: "horaries", 
          attributes: ["idHorary", "startTime", "endTime", "day"], 
        }
      ]
    });

    res.status(200).json(courts);
  } catch (error) {
    res.status(500).json({ error: error.message || error });
  }
};