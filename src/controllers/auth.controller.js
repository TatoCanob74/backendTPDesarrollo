import bcrypt  from "bcryptjs";
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

export default registro;
 


