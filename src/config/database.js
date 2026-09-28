import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect : "mysql",
    logging: false
  }
);

sequelize.authenticate()
  .then(() => console.log("Conectado"))
  .catch(err => console.error("Error de conexión:", err));

// Se exporta la promesa para que los scripts esperen ESTE sync en vez de lanzar otro:
// dos sync en paralelo compiten por crear las mismas tablas e índices y uno falla.
export const dbReady = sequelize.sync({ alter: false })
  .catch(err => console.error("Error al sincronizar los modelos:", err.message));

export default sequelize;
