// Migra una base que ya tiene datos al modelo con complejos. Se corre UNA vez, antes de
// levantar el backend nuevo, y es idempotente: si se vuelve a correr no rompe ni duplica nada.
// Uso: npm run migrar-complejos
//
// Por qué hace falta: database.js usa sync({ alter: false }), que crea las tablas que faltan
// (Complejos) pero NO modifica las existentes. Canchas y Usuarios hay que cambiarlas a mano.
//
// Pasos:
//   1. Espera el sync de database.js, que crea la tabla Complejos.
//   2. Agrega SUPERADMIN al ENUM de Usuarios.typeUser.
//   3. Agrega Canchas.idComplex.
//   4. Por cada localidad que tenga canchas crea un complejo "Complejo <localidad>" y le pasa
//      esas canchas, así ninguna queda sin complejo.
//   5. Hace obligatoria Canchas.idComplex y le pone la FK a Complejos.
//   6. Borra la vieja Canchas.idLocateCourt (la localidad ahora es del complejo).
import sequelize, { dbReady } from "../src/config/database.js";
import "../src/models/association.js";

const q = (sql, replacements = {}) =>
  sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT });
const run = (sql, replacements = {}) => sequelize.query(sql, { replacements });

const db = process.env.DB_NAME;

const columnExists = async (table, column) => {
  const rows = await q(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = :db AND LOWER(TABLE_NAME) = LOWER(:table) AND COLUMN_NAME = :column`,
    { db, table, column }
  );
  return rows.length > 0;
};

const foreignKeysOf = async (table, column) => {
  const rows = await q(
    `SELECT CONSTRAINT_NAME AS name FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = :db AND LOWER(TABLE_NAME) = LOWER(:table)
       AND COLUMN_NAME = :column AND REFERENCED_TABLE_NAME IS NOT NULL`,
    { db, table, column }
  );
  return rows.map((r) => r.name);
};

try {
  await sequelize.authenticate();

  // 1
  await dbReady;
  console.log("[1] Tabla Complejos lista.");

  // 2
  await run("ALTER TABLE Usuarios MODIFY typeUser ENUM('SUPERADMIN','ADMIN','CLIENTE') NOT NULL");
  console.log("[2] Usuarios.typeUser acepta SUPERADMIN.");

  // 3
  if (!(await columnExists("Canchas", "idComplex"))) {
    await run("ALTER TABLE Canchas ADD COLUMN idComplex INT NULL");
    console.log("[3] Columna Canchas.idComplex agregada.");
  } else {
    console.log("[3] Canchas.idComplex ya existía.");
  }

  // 4
  if (await columnExists("Canchas", "idLocateCourt")) {
    const pendientes = await q(
      "SELECT DISTINCT idLocateCourt AS idLocation FROM Canchas WHERE idComplex IS NULL"
    );

    for (const { idLocation } of pendientes) {
      const [location] = await q(
        "SELECT nomLocation FROM Localidads WHERE idLocation = :idLocation",
        { idLocation }
      );
      const nameComplex = `Complejo ${location?.nomLocation ?? idLocation}`;

      let [complex] = await q(
        "SELECT idComplex FROM Complejos WHERE nameComplex = :nameComplex AND idLocation = :idLocation",
        { nameComplex, idLocation }
      );
      if (!complex) {
        await run(
          "INSERT INTO Complejos (nameComplex, addressComplex, idLocation) VALUES (:nameComplex, 'Dirección a completar', :idLocation)",
          { nameComplex, idLocation }
        );
        [complex] = await q(
          "SELECT idComplex FROM Complejos WHERE nameComplex = :nameComplex AND idLocation = :idLocation",
          { nameComplex, idLocation }
        );
      }

      await run(
        "UPDATE Canchas SET idComplex = :idComplex WHERE idLocateCourt = :idLocation AND idComplex IS NULL",
        { idComplex: complex.idComplex, idLocation }
      );
      console.log(`[4] Canchas de la localidad ${idLocation} → "${nameComplex}" (id ${complex.idComplex}).`);
    }
  }

  const [{ sinComplejo }] = await q("SELECT COUNT(*) AS sinComplejo FROM Canchas WHERE idComplex IS NULL");
  if (Number(sinComplejo) > 0) {
    throw new Error(`Quedaron ${sinComplejo} cancha(s) sin complejo. Revisalas antes de seguir.`);
  }

  // 5
  await run("ALTER TABLE Canchas MODIFY idComplex INT NOT NULL");
  if ((await foreignKeysOf("Canchas", "idComplex")).length === 0) {
    await run(
      `ALTER TABLE Canchas ADD CONSTRAINT fk_canchas_complejo
       FOREIGN KEY (idComplex) REFERENCES Complejos (idComplex)
       ON UPDATE CASCADE ON DELETE RESTRICT`
    );
  }
  console.log("[5] Canchas.idComplex es obligatoria y apunta a Complejos.");

  // 6
  if (await columnExists("Canchas", "idLocateCourt")) {
    for (const fk of await foreignKeysOf("Canchas", "idLocateCourt")) {
      await run(`ALTER TABLE Canchas DROP FOREIGN KEY \`${fk}\``);
    }
    await run("ALTER TABLE Canchas DROP COLUMN idLocateCourt");
    console.log("[6] Columna Canchas.idLocateCourt eliminada.");
  } else {
    console.log("[6] Canchas.idLocateCourt ya no existía.");
  }

  const admins = await q("SELECT emailUser FROM Usuarios WHERE typeUser = 'ADMIN'");
  console.log("\nMigración terminada.");
  if (admins.length) {
    console.log(
      "Ojo: estos usuarios siguen siendo ADMIN pero todavía no tienen complejo, así que el\n" +
      "backend les va a responder 403 hasta que el superadmin les asigne uno:\n  " +
      admins.map((a) => a.emailUser).join("\n  ") +
      "\nSi alguno sos vos, promovete con: npm run crear-superadmin -- <email> <password>"
    );
  }
  process.exit(0);
} catch (error) {
  console.error("La migración falló:", error.message);
  process.exit(1);
}
