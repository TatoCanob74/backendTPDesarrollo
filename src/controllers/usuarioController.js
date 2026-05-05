//findAll recupera todos los datos, await le mete un paro al node haciendo que espere
import Usuario from "../models/usuarios.js";

export const createUsuarios = async (req, res) => { //async hace operaciones que tardan tiempo 
  try {
    const {nombre, apellido, email, fechaNacimiento, tipo, contraseña, nomusuario} = req.body;
    const newUsuario = await Usuario.create({
      nombre,
      apellido,
      email,
      fechaNacimiento,
      tipo,
      contraseña,
      nomusuario
    })
    res.json(newUsuario)
  } catch (error) {
    res.status(500).json({error: error.message});
  }
};

export default createUsuarios;