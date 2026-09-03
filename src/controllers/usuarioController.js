import { User } from "../models/usuarios.js";
import { validateBirthDate } from "../utils/birthDate.js";

// Campos que el usuario puede editar de su propio perfil.
// El email y el tipo de usuario quedan afuera a propósito: el email identifica
// la cuenta en el login y el tipo solo lo cambia un administrador.
const EDITABLE_FIELDS = ["nameUser", "surnameUser", "dateUser", "aliasUser"];

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

    if (!nameUser || !surnameUser || !dateUser || !aliasUser) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    // La misma validación que en el registro, para que no se pueda esquivar
    // guardando una fecha imposible desde la pantalla de perfil.
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
    res.status(500).json({ error: error.message });
  }
};
