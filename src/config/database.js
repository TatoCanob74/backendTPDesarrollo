const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "datos",     // nombre de la base de datos
  "root",      // usuario MySQL
  "",          // contraseña MySQL
  {
    host: "localhost",
    dialect: "mysql"
  }
);

// Verificar conexión
sequelize.authenticate()
  .then(() => {
    console.log("Conexión exitosa a MySQL");
  })
  .catch((err) => {
    console.error("Error al conectar a MySQL:", err);
  });

module.exports = sequelize;
