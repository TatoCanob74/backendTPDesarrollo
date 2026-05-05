import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect : "mysql",  //Motor de Base de Datos 
    dialectOptions: {
      ssl: {
        require:true,
        rejectUnauthorized:false
      }
    },
    logging: false
  }
);

//Test conexión
sequelize.authenticate()
  .then(() => console.log("Conectado a Railway"))  //Promesa, se ejecuta cuando sale bien
  .catch(err => console.error("Error de conexión:", err)); //Catch, se ejecuta cuando falla

export default sequelize;
