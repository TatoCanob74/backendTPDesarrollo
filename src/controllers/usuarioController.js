import { User } from "../models/usuarios.js";
import { Court } from "../models/cancha.js";

export const createUser = async (req, res) => {
  try {
    const { nameUser, surnameUser, emailUser, dateUser, typeUser, passwordUser, aliasUser } = req.body;

    if (!nameUser || !surnameUser || !emailUser || !dateUser || !typeUser || !passwordUser || !aliasUser) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    if (!emailUser.includes("@")) {
      return res.status(400).json({ error: "El email no contiene el arroba" });
    }

    const newUser = await User.create({
      nameUser,
      surnameUser,
      emailUser,
      dateUser,
      typeUser,
      passwordUser,
      aliasUser
    });
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const seeCourts = async (req, res) => {
  try {
    const courts = await Court.findAll({
      where: {
        stateCourt: "DISPONIBLE"
      }
    });
    res.status(200).json(courts);
  } catch (error) {
    res.status(500).json({ error });
  }
};

export default createUser;
