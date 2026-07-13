import { Court } from "../models/cancha.js";

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
    }
    const courts = await Court.findAll({
      where: filters
    });
    res.status(200).json(courts);
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
