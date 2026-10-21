// Prepara una base que ya tiene datos para el pago en efectivo con seña y el vencimiento de las
// reservas pendientes sin pagar. Se corre UNA vez, antes de
// levantar el backend nuevo, y es idempotente: si se vuelve a correr no rompe ni duplica nada.
// Uso: npm run migrar-pago-efectivo
//
// Por qué hace falta: database.js usa sync({ alter: false }), que no modifica tablas existentes.
//
// Pasos:
//   1. Agrega los estados "ausente" y "vencida" a Reservas.stateReserva.
//   2. Agrega Reservas.paymentMethod. Las reservas que ya existían quedan como MERCADO_PAGO.
//   3. Agrega Reservas.depositAmount, cashPaidAt y cashRegisteredBy (con su FK a Usuarios).
//   4. Agrega Reservas.createdReserve. Las reservas que ya existían toman la fecha de la migración,
//      así que las pendientes viejas tienen todavía un plazo completo para pagarse antes de vencer.
import sequelize from "../src/config/database.js";

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

const addColumnIfMissing = async (column, definition) => {
  if (await columnExists("Reservas", column)) {
    console.log(`    Reservas.${column} ya existía.`);
    return false;
  }
  await run(`ALTER TABLE Reservas ADD COLUMN ${column} ${definition}`);
  console.log(`    Reservas.${column} agregada.`);
  return true;
};

try {
  await sequelize.authenticate();

  // 1 (MODIFY con la lista completa: correrlo de nuevo deja la columna igual)
  await run(
    "ALTER TABLE Reservas MODIFY COLUMN stateReserva " +
      "ENUM('pendiente','confirmada','cancelada','ausente','vencida') NOT NULL DEFAULT 'pendiente'"
  );
  console.log('[1] Reservas.stateReserva acepta "ausente" y "vencida".');

  // 2
  console.log("[2] Forma de pago:");
  await addColumnIfMissing("paymentMethod", "ENUM('MERCADO_PAGO','EFECTIVO') NOT NULL DEFAULT 'MERCADO_PAGO'");

  // 3
  console.log("[3] Seña y cobro en efectivo:");
  await addColumnIfMissing("depositAmount", "INT NULL");
  await addColumnIfMissing("cashPaidAt", "DATETIME NULL");
  if (await addColumnIfMissing("cashRegisteredBy", "INT NULL")) {
    await run(
      "ALTER TABLE Reservas ADD CONSTRAINT Reservas_cashRegisteredBy_fk " +
        "FOREIGN KEY (cashRegisteredBy) REFERENCES Usuarios (idUser)"
    );
  }

  // 4
  console.log("[4] Plazo de pago:");
  await addColumnIfMissing("createdReserve", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");

  console.log("\nMigración terminada.");
  process.exit(0);
} catch (error) {
  console.error("La migración falló:", error.message);
  process.exit(1);
}
