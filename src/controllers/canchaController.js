import { Court } from "../models/cancha.js";
import { Horary } from "../models/Horario.js";

<<<<<<< HEAD
<<<<<<< HEAD
export const seeCourts = async(req, res) => {
  try {
    const filters = {stateCourt : 'Disponible'};
    if (req.query.courtType){
      filters.courtType = req.query.courtType;
=======
export const seeCourts = async (req, res) => {
  try {
    const filters = { stateCourt: 'DISPONIBLE' };
    if (req.query.typeCourt) {
      filters.typeCourt = req.query.typeCourt;
>>>>>>> origin/santy
=======
export const seeCourtsWithHoraries = async (req, res) => {
  try {
    const filters = { stateCourt: 'DISPONIBLE' };
    if (req.query.typeCourt) {
      filters.typeCourt = req.query.typeCourt;
>>>>>>> origin/rama/Francisco
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
<<<<<<< HEAD
<<<<<<< HEAD
  } catch(error) {
    res.status(500).json({error});
  };
};
=======
  } catch (error) {
    res.status(500).json({ error });
  }
};
>>>>>>> origin/santy
=======
  } catch (error) {
    res.status(500).json({ error: error.message || error });
  }
};
>>>>>>> origin/rama/Francisco
