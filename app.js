import express from 'express';
import db from './src/config/database.js';
import Cancha from './src/models/Cancha.js';

const app = express();

const conexion = async () => {
    try {
        await db.authenticate();
        await db.sync(); 
        console.log('CONECTADO A MYSQL');
    } catch (error) {
        console.error('ERROR AL CONECTAR:', error);
    }
}

conexion();

app.listen(3002, () => console.log('Servidor en puerto 3002'));