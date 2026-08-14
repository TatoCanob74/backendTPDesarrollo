import { User } from "../models/usuarios.js";

// GET /usuarios/me — el usuario logueado ve su propio perfil
export const getMyProfile = async (req, res) => {
  try {
    const idUser = req.user.idUser;

    const user = await User.findByPk(idUser, {
      attributes: { exclude: ["passwordUser"] } // nunca devolver el hash de la contraseña
    });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /usuarios/me — el usuario logueado edita sus propios datos
export const updateMyProfile = async (req, res) => {
  try {
    const idUser = req.user.idUser;
    const { nameUser, surnameUser, dateUser, aliasUser } = req.body;

    const user = await User.findByPk(idUser);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    await user.update({ nameUser, surnameUser, dateUser, aliasUser });

    res.status(200).json({ message: "Perfil actualizado correctamente." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};