import express from 'express';
import db from './src/config/database.js'; // El punto y la barra son clave

const app = express();

try {
  await db.authenticate();
  console.log('CONECTADO A MYSQL');
} catch (error) {
  console.error('ERROR:', error);
}

app.listen(3002, () => console.log('Servidor en puerto 3002'));