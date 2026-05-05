import { Sequelize } from 'sequelize';

const db = new Sequelize('canchas_db', 'root', 'Dibujogratis5', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

export default db;