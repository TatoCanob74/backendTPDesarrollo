import { verifyToken } from "./verifyToken.js";

export const isAdmin = (req, res, next) => {
  if(req.user.typeUser != "ADMIN"){
    return res.status(403).json({message: "Acceso denegado"});
  }
  next();
};

export { verifyToken };
