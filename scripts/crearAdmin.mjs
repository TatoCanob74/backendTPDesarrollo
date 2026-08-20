/**
 * Crea (o promueve) un usuario ADMIN.
 *
 * Hace falta porque POST/PUT/PATCH/DELETE de canchas exigen isAdmin, y el
 * registro público fuerza typeUser: 'CLIENTE'. Sin esto no hay forma de entrar
 * al panel de administración.
 *
 * Uso:
 *   npm run crear-admin -- admin@canchaya.com MiClave123
 *   npm run crear-admin -- admin@canchaya.com MiClave123 Santiago Starck
 *
 * Si el email ya existe, lo promueve a ADMIN y le actualiza la contraseña.
 */
import bcrypt from "bcryptjs";
import sequelize from "../src/config/database.js";
import { User } from "../src/models/usuarios.js";

const [emailUser, passwordUser, nameUser = "Admin", surnameUser = "CanchaYa"] =
  process.argv.slice(2);

if (!emailUser || !passwordUser) {
  console.error("Faltan datos.\n  npm run crear-admin -- <email> <password> [nombre] [apellido]");
  process.exit(1);
}
if (!emailUser.includes("@")) {
  console.error("El email tiene que contener un @.");
  process.exit(1);
}
if (passwordUser.length < 8) {
  console.error("La contraseña tiene que tener al menos 8 caracteres (lo valida el modelo).");
  process.exit(1);
}

try {
  await sequelize.authenticate();
  await sequelize.sync();

  const passwordHash = await bcrypt.hash(passwordUser, 10);
  const existente = await User.findOne({ where: { emailUser } });

  if (existente) {
    await existente.update({
      typeUser: "ADMIN",
      stateUser: "ACTIVO",
      passwordUser: passwordHash
    });
    console.log(`Usuario existente promovido a ADMIN: ${emailUser}`);
  } else {
    await User.create({
      nameUser,
      surnameUser,
      emailUser,
      dateUser: "01/01/1990",          // el modelo exige el formato dd/mm/aaaa
      typeUser: "ADMIN",
      passwordUser: passwordHash,
      aliasUser: emailUser.split("@")[0],
      stateUser: "ACTIVO"
    });
    console.log(`ADMIN creado: ${emailUser}`);
  }

  console.log("Ya podés iniciar sesión y entrar al panel de administración.");
  process.exit(0);
} catch (error) {
  console.error("No se pudo crear el admin:", error.message);
  process.exit(1);
}
