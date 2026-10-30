import { sendError } from "../utils/httpError.js";
import { getProfile, updateProfile } from "../services/usuario.service.js";

export const getMyProfile = async (req, res) => {
  try {
    const user = await getProfile(req.user.idUser);
    res.status(200).json(user);
  } catch (error) {
    sendError(res, error);
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const user = await updateProfile(req.user.idUser, req.body);
    res.status(200).json({
      message: "Perfil actualizado correctamente.",
      user
    });
  } catch (error) {
    sendError(res, error);
  }
};
