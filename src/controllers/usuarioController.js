import { User } from "../models/usuarios.js";
import { validateBirthDate } from "../utils/birthDate.js";
import { sendError } from "../utils/httpError.js";

const EDITABLE_FIELDS = ["nameUser", "surnameUser", "dateUser", "aliasUser"];

export const getMyProfile = async (req, res) => {
  try {
    const idUser = req.user.idUser;

    const user = await User.findByPk(idUser, {
      attributes: { exclude: ["passwordUser"] }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.status(200).json(user);
  } catch (error) {
    sendError(res, error);
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const idUser = req.user.idUser;
    const { nameUser, surnameUser, dateUser, aliasUser } = req.body;

    if (!nameUser || !surnameUser || !dateUser || !aliasUser) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    const birthDateError = validateBirthDate(dateUser);
    if (birthDateError) {
      return res.status(400).json({ error: birthDateError });
    }

    const user = await User.findByPk(idUser);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    await user.update(
      { nameUser: nameUser.trim(), surnameUser: surnameUser.trim(), dateUser, aliasUser: aliasUser.trim() },
      { fields: EDITABLE_FIELDS }
    );

    const { passwordUser: _hash, ...updated } = user.toJSON();

    res.status(200).json({
      message: "Perfil actualizado correctamente.",
      user: updated
    });
  } catch (error) {
    sendError(res, error);
  }
};
