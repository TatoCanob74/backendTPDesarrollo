// Prepara una base que ya tiene datos para la verificación de email. Se corre UNA vez, antes de
// levantar el backend nuevo, y es idempotente: si se vuelve a correr no rompe ni duplica nada.
// Uso: npm run migrar-verificacion
//
// Por qué hace falta: database.js usa sync({ alter: false }), que crea las tablas que faltan
// (CodigosVerificacion) pero NO modifica las existentes. La columna nueva de Usuarios hay que
// agregarla a mano.
//
// Pasos:
//   1. Espera el sync de database.js, que crea CodigosVerificacion si no existe.
//   2. Borra la tabla vieja "Codigo de Verificacion" (nombre con espacios de una versión anterior).
//   3. Si CodigosVerificacion quedó creada con una versión anterior del modelo (FK que acepta NULL
//      o sin ON DELETE CASCADE) y está vacía, la vuelve a crear con la definición actual.
//   4. Agrega Usuarios.verifiedUser. Los usuarios que ya existían quedan verificados.
//   5. Deja el default de la base en 0, igual que el modelo: los usuarios nuevos arrancan sin verificar.
import sequelize, { dbReady } from "../src/config/database.js";
import { Verification } from "../src/models/association.js";

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

// Devuelve si la columna acepta NULL y la regla ON DELETE de su FK (null si no tiene FK)
const foreignKeyInfo = async (table, column) => {
  const [col] = await q(
    `SELECT IS_NULLABLE AS nullable FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = :db AND LOWER(TABLE_NAME) = LOWER(:table) AND COLUMN_NAME = :column`,
    { db, table, column }
  );
  const [fk] = await q(
    `SELECT rc.DELETE_RULE AS deleteRule
     FROM information_schema.KEY_COLUMN_USAGE k
     JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
       ON rc.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND rc.CONSTRAINT_NAME = k.CONSTRAINT_NAME
     WHERE k.TABLE_SCHEMA = :db AND LOWER(k.TABLE_NAME) = LOWER(:table) AND k.COLUMN_NAME = :column`,
    { db, table, column }
  );
  return { nullable: col?.nullable === "YES", deleteRule: fk?.deleteRule ?? null };
};

try {
  await sequelize.authenticate();

  // 1
  await dbReady;
  console.log("[1] Tabla CodigosVerificacion lista.");

  // 2
  await run("DROP TABLE IF EXISTS `Codigo de Verificacion`");
  console.log('[2] Tabla vieja "Codigo de Verificacion" eliminada (si existía).');

  // 3
  const { nullable, deleteRule } = await foreignKeyInfo("CodigosVerificacion", "idUser");
  if (nullable || deleteRule !== "CASCADE") {
    const [{ total }] = await q("SELECT COUNT(*) AS total FROM CodigosVerificacion");
    if (Number(total) > 0) {
      throw new Error(
        `CodigosVerificacion tiene una FK vieja (NULL: ${nullable}, ON DELETE: ${deleteRule}) y ${total} fila(s). Revisala a mano.`
      );
    }
    await Verification.sync({ force: true });
    console.log("[3] CodigosVerificacion estaba creada con el modelo viejo: se recreó.");
  } else {
    console.log("[3] CodigosVerificacion ya tiene idUser NOT NULL y ON DELETE CASCADE.");
  }

  // 4
  if (!(await columnExists("Usuarios", "verifiedUser"))) {
    // NOT NULL + DEFAULT 1: MySQL rellena con 1 todas las filas que ya existen
    await run("ALTER TABLE Usuarios ADD COLUMN verifiedUser TINYINT(1) NOT NULL DEFAULT 1");
    const [{ total }] = await q("SELECT COUNT(*) AS total FROM Usuarios");
    console.log(`[4] Columna Usuarios.verifiedUser agregada: ${total} usuario(s) existente(s) quedaron verificados.`);
  } else {
    console.log("[4] Usuarios.verifiedUser ya existía.");
  }

  // 5 (fuera del if: si una corrida anterior se cortó entre el 4 y el 5, esta lo completa)
  await run("ALTER TABLE Usuarios ALTER COLUMN verifiedUser SET DEFAULT 0");
  console.log("[5] El default de Usuarios.verifiedUser es 0: los usuarios nuevos arrancan sin verificar.");

  console.log("\nMigración terminada.");
  process.exit(0);
} catch (error) {
  console.error("La migración falló:", error.message);
  process.exit(1);
}
