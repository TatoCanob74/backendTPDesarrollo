/**
 * Diagnóstico de solo lectura de la base. No escribe ni modifica nada.
 *
 * Chequea las dos cosas que rompen el ABM de canchas en silencio:
 *   1) que Canchas.idCourt sea AUTO_INCREMENT (si no, POST /canchas falla)
 *   2) que la tabla de localidades se llame como dice el modelo (si no, el
 *      select de sede queda vacío y no se puede crear ninguna cancha)
 *
 * Uso: npm run revisar-db
 */
import mysql from "mysql2/promise";

const db = process.env.DB_NAME;
let conn;

try {
  conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: db
  });
} catch (error) {
  console.error(`No se pudo conectar a la base: ${error.message}`);
  process.exit(1);
}

const [tablas] = await conn.query(
  "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
  [db]
);
const nombres = tablas.map((t) => t.TABLE_NAME);
console.log(`Tablas en "${db}": ${nombres.join(", ") || "(ninguna)"}\n`);

let problemas = 0;

// 1) AUTO_INCREMENT en Canchas.idCourt
const [idCourt] = await conn.query(
  "SELECT EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Canchas' AND COLUMN_NAME = 'idCourt'",
  [db]
);
if (!idCourt.length) {
  console.log("[ ] La tabla Canchas todavía no existe. Se crea sola al levantar el backend.");
} else if (idCourt[0].EXTRA.includes("auto_increment")) {
  console.log("[OK] Canchas.idCourt es auto_increment.");
} else {
  problemas++;
  console.log("[X] Canchas.idCourt NO es auto_increment: POST /canchas va a fallar.");
  console.log("     Arreglalo con:");
  console.log("     ALTER TABLE Canchas MODIFY idCourt INT NOT NULL AUTO_INCREMENT;");
}

// 2) Nombre de la tabla de localidades
const esperada = "Localidads"; // el tableName que declara src/models/localidad.js
const candidatas = nombres.filter((n) => n.toLowerCase().startsWith("localidad"));
// En Windows MySQL guarda los nombres en minuscula, asi que se compara sin distinguir mayusculas
const real = candidatas.find((n) => n.toLowerCase() === esperada.toLowerCase());
if (real) {
  const [filas] = await conn.query(`SELECT COUNT(*) AS n FROM \`${esperada}\``);
  console.log(`[OK] Existe la tabla ${real} con ${filas[0].n} sede(s).`);
  if (filas[0].n === 0) {
    console.log("     Ojo: sin sedes cargadas no vas a poder crear canchas (la sede es obligatoria).");
  }
} else if (candidatas.length) {
  problemas++;
  console.log(`[X] El modelo espera la tabla "${esperada}" pero en la base está: ${candidatas.join(", ")}.`);
  console.log("     O renombrás la tabla:");
  console.log(`     RENAME TABLE \`${candidatas[0]}\` TO \`${esperada}\`;`);
  console.log("     o cambiás el tableName en src/models/localidad.js.");
} else {
  console.log("[ ] Todavía no hay tabla de localidades. Se crea sola al levantar el backend.");
}

await conn.end();
console.log(problemas === 0 ? "\nSin problemas detectados." : `\n${problemas} problema(s) a resolver.`);
process.exit(problemas === 0 ? 0 : 1);
