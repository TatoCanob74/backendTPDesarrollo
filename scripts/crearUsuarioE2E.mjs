// Crea (o deja como nuevo) el usuario CLIENTE que usa el test end-to-end del frontend (Cypress).
// Solo corre contra la base de test, igual que los tests del backend.
// Uso: npm run e2e:seed   (lee .env y después .env.test, que cambia DB_NAME)
//
// Las credenciales son de prueba y tienen que coincidir con frontend/cypress.config.js.
import bcrypt from "bcryptjs";
import sequelize, { dbReady } from "../src/config/database.js";
import { User } from "../src/models/user.js";

export const E2E_EMAIL = "e2e.cliente@canchaya.test";
export const E2E_PASSWORD = "ClienteE2E2026";

if (!process.env.DB_NAME?.endsWith("_test")) {
  console.error(`Este script solo corre contra una base de test, no contra "${process.env.DB_NAME}". Revisá DB_NAME en .env.test`);
  process.exit(1);
}

try {
  await sequelize.authenticate();
  await dbReady;

  const datos = {
    nameUser: "Cliente",
    surnameUser: "EndToEnd",
    emailUser: E2E_EMAIL,
    dateUser: "01/01/2000",
    typeUser: "CLIENTE",
    passwordUser: await bcrypt.hash(E2E_PASSWORD, 10),
    aliasUser: "clientee2e",
    stateUser: "ACTIVO",
    // Ya verificado: el test prueba el acceso por niveles, no el mail de verificación
    verifiedUser: true
  };

  const existente = await User.findOne({ where: { emailUser: E2E_EMAIL } });
  if (existente) {
    await existente.update(datos);
    console.log(`Usuario de E2E actualizado: ${E2E_EMAIL}`);
  } else {
    await User.create(datos);
    console.log(`Usuario de E2E creado: ${E2E_EMAIL}`);
  }

  process.exit(0);
} catch (error) {
  console.error("No se pudo crear el usuario de E2E:", error.message);
  process.exit(1);
}
