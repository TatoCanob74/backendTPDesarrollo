import { verifyToken } from "./verifyToken.js";

<<<<<<< HEAD
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if(!authHeader || !authHeader.startsWith("Bearer ")){
    return res.status(401).json({message: "Token no proporcionado"})
  }

   try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({message: "Token inválido"})
    }
};

=======
>>>>>>> origin/santy
export const isAdmin = (req, res, next) => {
  if(req.user.typeUser != "ADMIN"){
    return res.status(403).json({message: "Acceso denegado"});
  }
  next();
};

export { verifyToken };
