import jwt from "jsonwebtoken";

export const verificarToken = (req, res, next) => {
  const authHeader = req.headers.autorizacion;
  if(!authHeader || !authHeader.startsWith("Bearer ")){
    return res.status(401).json({message: "Token no proporcionado"})
  }

   try {
      const token = authHeader.split(" ")[1];
      const decodificado = jwt.verify(token, process.env.JWT_SECRET);
      req.usuario = decodificado;
      next();
    } catch (err) {
      return res.status(401).json({message: "Token inválido"})
    }
};

export const esAdmin = (req, res, next) => {
  if(req.usuario.tipo != "ADMIN"){
    return res.status(403).json({message: "Acceso denegado"});
  }
};