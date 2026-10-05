# CanchaYa - Backend

## ¿Qué es CanchaYa?

CanchaYa es un sistema de reservas de canchas de fútbol, tenis o pádel, con pago a través de Mercado Pago.

Este software fue realizado para cumplir con el TP de aprobación directa de Desarrollo de Software.

Este repositorio es el de backend.

## Integrantes

- **Francisco Gallon:** [Perfil de GitHub de Francisco](https://github.com/TatoCanob74)
- **Santiago Martínez:** [Perfil de GitHub de Santiago](https://github.com/santistark-ctrl)

## Link al otro repositorio

- https://github.com/TatoCanob74/frontendTPDWS

Ese es el link del repositorio donde tenemos el frontend.

## Stack

El stack utilizado para realizar el backend es el siguiente:

- Node.js
- Express 5
- Sequelize
- MySQL
- JWT + bcrypt
- Mercado Pago
- Vitest + supertest

## Requisitos Previos

Antes de empezar hay que tener instalado lo siguiente:

- **Node.js ≥ 20.6**.
- **MySQL** corriendo.

## Instalación y puesta en marcha

Para instalar el backend hay que realizar lo siguiente:

1. Clonar el comando `git clone` con la URL del repositorio. Luego entrar a la carpeta.
2. Instalar las dependencias necesarias con `npm install`.
3. Copiar `.env.example` a `.env`y completarlo.
4. Crear la base de datos en `MySQL` con el mismo nombre que tengas en tu `.env` en `DB_NAME`.
5. Crear el superadmin con el script `crear-superadmin` con `npm run crear-superadmin -- <email> <password>`.
6. Cargar los datos necesarios con el script `cargar-datos` con `npm run cargar-datos`.
7. Levantar el servidor con el comando `npm run dev`.

**Nota:** La API queda corriendo en: `http://localhost:3000`. Ese valor se pone luego en la variable de entorno `VITE_API_URL` en el frontend.

## Variables de Entorno

Las variables de entorno se encuentran en el archivo `.env.example` donde allí están especificadas cada una.

**Recomendación:** Usar credenciales de prueba en `MP_ACCESS_TOKEN`.

## Scripts Disponibles

| Script           | Funcionalidad                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| dev              | Arranca un servidor de desarrollo local para tu proyecto. Usa `nodemon` que al modificar un archivo se reinicia automáticamente.               |
| start            | Ejecuta tu aplicación en modo de producción. La diferencia con `nodemon` es que no se reinicia al modificar archivos.                          |
| crear-superadmin | Crea (o promueve) el usuario SUPERADMIN. Su forma de uso es la siguiente: `npm run crear-superadmin -- <email> <password> [nombre] [apellido]` |
| cargar-datos     | Carga datos de prueba.                                                                                                                         |
| migrar-complejos | Migra una base que ya tiene datos al modelo con complejos.                                                                                     |
| revisar-db       | Diagnóstico de solo lectura de la base de datos.                                                                                               |
| test             | Ejecuta toda la suite de pruebas una sola vez y te da el resultado final.                                                                      |
| test:watch       | Ejecuta las pruebas pero mantiene el proceso abierto en la terminal.                                                                           |

## Tests

En el backend, `npm test` necesita **MySQL** y una base vacía `canchaya_test`, las tablas se crean automáticamente con sync() y un archivo `.env.test` copiando el `.env` y cambiando la variable `DB_NAME=canchaya_test` esto es para que el test no tenga que ir directo a la base de datos de la app.

Los tests que hay son los siguientes:

- `birthDate.test.js`: Es un test unitario que no necesita base de datos. El test unitario se puede correr solo con `npx vitest run tests/birthDate.test.js`
- `app.test.js`: Integrado con supertest. Es un test de integración que verifica que una ruta inexistente responde 404 en JSON.

La guarda de `vitest.config.js` esta configurada para que se impida correr contra la base de desarrollo. Esto esta configurado de esta manera para evitar que se acceda a la misma.

## Usuarios y Roles

La app `CanchaYa` fue pensada y diseñada para soportar 3 Roles:

| Rol        | Función                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Cliente    | Es el que reserva la cancha, el usuario final.                                                                         |
| Admin      | Es el que administra su complejo junto a sus canchas.                                                                  |
| Superadmin | Es el que administra la aplicación entera; tiene acceso a todos los complejos de todas las sedes, junto a sus canchas. |

El `superadmin` se crea mediante el script antes mencionado `(crear-superadmin)` y el registro público siempre va a ser para el rol de `cliente` esto está hecho para evitar que alguien se registre como Administrador. El rol de `admin` se da solo por alta desde el superadmin.

## Documentación técnica

Link de acceso a la Documentación técnica del backend:

- [Documentación del Backend](https://github.com/TatoCanob74/backendTPDesarrollo/blob/rama/Francisco/DOCUMENTACION_BACKEND.md)

La documentación fue ordenada por módulos donde empezamos por los archivo generales (app.js, database.js) y luego fuimos escalando a las carpetas con sus archivos correspondientes, dejando detallado los tecnicismos de lo realizado.

## API / endpoints

Para ver todos los endpoints que tenemos en nuestro backend ver la sección 6 de nuestra Documentación Técnica:

- [Ver todos los endpoints](https://github.com/TatoCanob74/backendTPDesarrollo/blob/rama/Francisco/DOCUMENTACION_BACKEND.md#6-rutas)
