import bcrypt  from "bcryptjs";
import jwt from "jsonwebtoken";
import { Usuario, emailUsuario } from "../models/usuarios.js";

export const registro = async (req, res) => {
  try {
    const {nombre, apellido, email, fechaNacimiento, tipo, contraseña, nomusuario} = req.body;

    const usuarioExiste = await emailUsuario(email);
    if (usuarioExiste){
      return res.status(400).json({error: "El mail ya está registrado."})
    }

    const passwordHash = await bcrypt.hash(contraseña, 10);

    if (!nombre || !apellido || !email || !fechaNacimiento || !tipo || !contraseña || !nomusuario){
      return res.status(400).json({error :"Todos los campos son obligatorios"});
    }
 
    if (!email.includes("@")) {
      return res.status(400).json({error :"El email no contiene el arroba"});
    }

    const newUsuario = await Usuario.create({
      nombre,
      apellido,
      email,
      fechaNacimiento,
      tipo,
      contraseña: passwordHash,
      nomusuario
    })
    res.status(201).json(newUsuario)
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export const login = async (req, res) => {
  const { email, contraseña} = req.body;

  if(!email ||!contraseña) {
    return res.status(422).json({message: "Email y contraseña requeridos"});
  }

  const usuario = await emailUsuario(email);
  if (!usuario) {
    return res.status(401).json({message: "Credenciales inválidas"});
  };

  const validacion = await bcrypt.compare(contraseña, usuario.contraseña);
  if(!validacion) {
    return res.status(401).json({message: "Credenciales inválidas"});
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email},
    process.env.JWT_SECRET,
    {
      expiresIn: "8h",
    }
  );
  return res.json({ token });
};

export default registro;
 


