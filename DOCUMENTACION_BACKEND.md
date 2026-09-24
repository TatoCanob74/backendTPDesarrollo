# CanchaYa — Documentación técnica del backend

Este documento reúne las decisiones de diseño e implementación del backend
(`BACKEND_TP`). Todo lo que acá se explica estaba antes escrito como comentarios
dentro del código; se movió a este archivo para que el código quede limpio y la
explicación siga estando disponible en un solo lugar. Es el complemento de
`DOCUMENTACION_FRONTEND.md`.

Stack: Node.js + Express 5, Sequelize 6 sobre MySQL, JWT (`jsonwebtoken`),
bcryptjs, SDK de MercadoPago. Módulos ES (`"type": "module"`).

---

## 1. Punto de entrada (`app.js`)

Orden de montaje: `cors()` → `express.json()` → routers → 404 → manejador de
errores. Todos los routers menos el de autenticación se montan en `/`; el de
autenticación va bajo `/auth`.

**404 en JSON.** Después de todos los routers hay un `app.use` que atrapa
cualquier ruta que no matcheó. Sin él, Express respondía un HTML
`Cannot GET /...`, que el frontend no puede parsear como error.

**Manejador de errores global.** Va último y declara los cuatro parámetros
(`err, req, res, next`): así es como Express lo reconoce como manejador de
errores y no como un middleware común. Evita que se filtren stack traces al
cliente. Distingue tres casos:

| Caso                                  | Status | Motivo                                                                                                                           |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `entity.parse.failed` / `SyntaxError` | 400    | Body con JSON inválido; lo lanza `express.json()` antes de llegar al controller. Antes devolvía las rutas internas del servidor. |
| `SequelizeValidationError`            | 400    | Validación del modelo que se escapó de un controller                                                                             |
| cualquier otro                        | 500    | Error genérico, sin detalle hacia afuera                                                                                         |

**Puerto.** Sale de `process.env.PORT` con `3000` como fallback. En Railway (o
cualquier hosting) el puerto lo asigna la plataforma: con `3000` fijo el
servicio queda inalcanzable al desplegar.

---

## 2. Conexión a la base (`src/config/database.js`)

La instancia de Sequelize se arma con `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
`DB_HOST` y `DB_PORT`, dialecto `mysql` y `logging: false` (si no, cada consulta
ensucia la consola).

Al importarse el módulo se hacen dos cosas:

- `sequelize.authenticate()` — prueba de conexión, loguea "Conectado" o el error.
- `sequelize.sync({ alter: false })` — crea las tablas que falten, pero **no**
  altera las existentes. Se eligió `alter: false` porque la base ya tiene datos
  reales y un `alter` podía reescribir columnas.

Las dos llevan `.catch`: sin eso, un fallo de conexión termina como
_unhandled rejection_ y tira el proceso.

---

## 3. Modelos (`src/models/`)

Todos los modelos usan `timestamps: false` y declaran `tableName` explícito,
porque la base ya existía con nombres propios.

### 3.1 `usuarios.js` — `User` (tabla `Usuarios`)

| Campo                                  | Tipo                       | Notas                                                       |
| -------------------------------------- | -------------------------- | ----------------------------------------------------------- |
| `idUser`                               | INTEGER PK autoincrement   |                                                             |
| `nameUser`, `surnameUser`, `aliasUser` | STRING                     | `notEmpty`                                                  |
| `emailUser`                            | STRING                     | `notEmpty`; identifica la cuenta en el login                |
| `dateUser`                             | STRING                     | fecha de nacimiento como `"dd/mm/aaaa"`, validada por regex |
| `typeUser`                             | ENUM `ADMIN` / `CLIENTE`   |                                                             |
| `passwordUser`                         | STRING(255)                | guarda el **hash** bcrypt                                   |
| `stateUser`                            | ENUM `ACTIVO` / `INACTIVO` |                                                             |

Dos detalles importantes:

- `dateUser` es un **string**, no un `DATEONLY`. Toda la validación de fecha de
  nacimiento trabaja sobre ese formato (ver §4.2).
- La validación `len: [8, 100]` de `passwordUser` se aplica sobre el hash, que
  siempre mide 60 caracteres. Por eso **nunca dispara**, y la longitud real de
  la contraseña hay que medirla en el controller antes de hashear (ver §5.2).

El archivo exporta además un helper `emailUser(email)` que busca un usuario por
email. Comparte nombre con el campo del modelo, así que en `auth.controller.js`
se importa renombrado a `findUserByEmail`.

### 3.2 `cancha.js` — `Court` (tabla `Canchas`)

`typeCourt` es un ENUM `FUTBOL` / `TENIS` / `PADEL`, `stateCourt` un ENUM
`DISPONIBLE` / `OCUPADO`, y `idLocateCourt` es la FK a `Localidads`.

`nameCourt` lleva dos validaciones: el `notEmpty` de siempre y un validador
propio `esTexto`. El motivo está en §4.3.

### 3.3 `Horario.js` — `Horary` (tabla `Horarios`)

`startTime` y `endTime` son `TIME`, `day` un ENUM con los siete días en
castellano y con tilde (`Miércoles`, `Sábado`). Hay un **índice único sobre
`(idCourt, day, startTime)`**: una misma cancha no puede tener dos franjas que
arranquen a la misma hora el mismo día.

### 3.4 `Reserva.js` — `Reserve` (tabla `Reservas`)

| Campo                           | Tipo                                          | Notas                                                  |
| ------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `idReserve`                     | INTEGER PK autoincrement                      |                                                        |
| `dateReserve`                   | DATEONLY                                      | solo fecha, sin hora (ej. `"2025-06-15"`)              |
| `totalAmount`                   | INTEGER                                       | precio de la cancha + servicios, congelado al reservar |
| `stateReserva`                  | ENUM `pendiente` / `confirmada` / `cancelada` | arranca en `pendiente`                                 |
| `idUser`, `idCourt`, `idHorary` | INTEGER FK                                    |                                                        |
| `paymentId`                     | STRING (nullable)                             | id del pago en MercadoPago                             |
| `paymentStatus`                 | STRING (nullable)                             | `approved`, `rejected`, `pending`, etc.                |

`totalAmount` se guarda en la reserva y no se recalcula: si después cambia el
precio de la cancha, la reserva ya hecha conserva lo que el usuario aceptó pagar.

### 3.5 `Servicio.js` — `Service` y `ReservaServicio.js` — `reserveService`

`Service` tiene `nameService`, `priceService` y `descriptionService`, los tres
con `notEmpty` + el validador `esTexto`.

`reserveService` es la tabla intermedia (`Reserva_Servicios`) con clave primaria
compuesta `(idReserve, idService)`.

> **Ojo con `priceService`.** El modelo lo declara `INTEGER`, pero en la base
> real la columna es `decimal(5,2)`, o sea que topea en 999.99. Por eso los
> precios de ejemplo en `seedData.mjs` se mantienen por debajo de ese valor.

### 3.6 `localidad.js` — `Location` (tabla `Localidads`)

El `tableName` es literalmente `"Localidads"` (así lo generó Sequelize en su
momento y así quedó en la base). Hay un script de diagnóstico que lo verifica,
porque si el nombre no coincide el select de sede queda vacío y no se puede
crear ninguna cancha (ver §9.3).

Lleva un **índice único sobre `(nameCountry, nomLocation)`** para no cargar dos
veces la misma localidad (por ejemplo Argentina/Rosario).

### 3.7 `association.js`

Centraliza todas las asociaciones y reexporta los modelos ya relacionados. Se
importa una sola vez desde `app.js`, antes de levantar el servidor.

| Relación           | Tipo                       | Alias                    |
| ------------------ | -------------------------- | ------------------------ |
| Reserva ↔ Servicio | N:M vía `reservaServicios` | `Servicios` / `Reservas` |
| Cancha → Horario   | 1:N                        | `Horarios`               |
| Cancha → Localidad | N:1                        | (sin alias)              |
| Cancha → Reserva   | 1:N                        | (sin alias)              |
| Horario → Reserva  | 1:N                        | (sin alias)              |
| Usuario → Reserva  | 1:N                        | (sin alias)              |

La asociación **Cancha ↔ Localidad** es la que más costó: sin ella no se puede
hacer `include` de la sede, y el listado de canchas no tiene forma de mostrar a
qué localidad pertenece cada una.

---

## 4. Utilidades (`src/utils/`)

### 4.1 `httpError.js` — `sendError(res, error, fallback)`

Traduce un error de Sequelize al status HTTP que corresponde. Sin esto,
cualquier validación que fallaba en el modelo (un `notEmpty`, un ENUM inválido,
una FK rota) caía en el `catch` genérico y salía como **500**. Un 500 significa
"se rompió el servidor"; si los datos que mandó el cliente están mal, el status
correcto es 400.

| Error de Sequelize                   | Status | Respuesta                                       |
| ------------------------------------ | ------ | ----------------------------------------------- |
| `SequelizeValidationError`           | 400    | los mensajes del modelo, concatenados           |
| `SequelizeUniqueConstraintError`     | 409    | "Ya existe un registro con esos datos."         |
| `SequelizeForeignKeyConstraintError` | 409    | "El dato está relacionado con otros registros." |
| `SequelizeDatabaseError`             | 400    | "Alguno de los valores enviados no es válido."  |
| cualquier otro                       | 500    | el `fallback`                                   |

El caso `SequelizeDatabaseError` cubre un valor fuera de un ENUM o de rango:
MySQL responde `Data truncated for column ...`, que no le sirve de nada al
usuario.

Todos los controllers usan `sendError` en su `catch`.

### 4.2 `birthDate.js` — validación de la fecha de nacimiento

La base guarda `dateUser` como string `"dd/mm/aaaa"`, así que la validación
trabaja sobre ese formato. La comparten el registro (`auth.controller.js`) y la
edición de perfil (`usuarioController.js`) para que las dos pantallas apliquen
exactamente las mismas reglas.

- `MIN_AGE = 16`, `MAX_AGE = 120`.
- `parseBirthDate(value)` → `Date` en UTC, o `null` si no es una fecha real del
  calendario. `Date.UTC` "corrige" las fechas inexistentes (31/02 pasa a ser
  03/03), así que se compara el resultado contra lo ingresado para descartarlas.
- `ageFromBirthDate(date)` → años cumplidos al día de hoy.
- `validateBirthDate(value)` → el mensaje de error listo para mostrarle al
  usuario, o `null` si está bien. Cubre: campo vacío, formato inválido, fecha
  futura, menor de 16 y mayor de 120.

Se trabaja todo en UTC para que el resultado no dependa de la zona horaria del
servidor.

### 4.3 `validators.js` — validación de tipo

`esTextoValido(value)` y `validarTextos({ etiqueta: valor })`.

Estas validaciones van **en los controllers y no en el modelo** porque los
controllers normalizan con `.trim()` antes de guardar: si el número llega como
`123`, `String(123).trim()` lo convierte en `"123"` y el modelo ya no puede
distinguirlo de un texto legítimo. La única forma de rechazarlo es mirar el tipo
del dato crudo, antes de normalizarlo.

Los validadores `esTexto` que igual están en los modelos (`Cancha`, `Servicio`,
`Localidad`) son la segunda línea de defensa: `notEmpty` valida que no esté
vacío, pero **no valida el tipo**, y un número como `123` se guardaba como
`"123"`.

---

## 5. Autenticación y autorización

### 5.1 Middlewares (`src/middlewares/`)

- **`verifyToken.js`** — exige el header `Authorization: Bearer <token>`,
  verifica la firma con `JWT_SECRET` y deja el payload en `req.user`. Responde
  401 si falta el token o si es inválido.
- **`verifyAdmin.js`** — exporta `isAdmin` (403 si `req.user.typeUser !== "ADMIN"`)
  y **una copia** de `verifyToken`.

> La duplicación de `verifyToken` en los dos archivos es real: las rutas de
> admin, horarios, localidades y servicios lo importan desde `verifyAdmin.js`,
> mientras que las de usuario y pagos lo importan desde `verifyToken.js`. Las dos
> implementaciones son idénticas. Unificarlas es una limpieza pendiente, pero
> cambia imports en seis archivos, así que se dejó documentado en vez de tocarlo.

`isAdmin` siempre va **después** de `verifyToken`: lee `req.user`, que lo deja el
anterior.

### 5.2 `auth.controller.js`

**`register`** — el orden de las validaciones importa: van **antes** de hashear,
porque si faltaba la contraseña `bcrypt` rompía con un 500 en lugar de responder
"todos los campos son obligatorios".

1. Todos los campos obligatorios → 400
2. Email con formato válido (regex) → 400
3. Contraseña de al menos 8 caracteres → 400. **Se mide acá** porque el modelo
   valida la longitud sobre el hash, que siempre tiene 60 caracteres (§3.1).
4. Fecha de nacimiento (`validateBirthDate`) → 400
5. Email no registrado → 400
6. Recién ahí: `bcrypt.hash(password, 10)` y `User.create`

El usuario se crea siempre con `typeUser: 'CLIENTE'` y `stateUser: 'ACTIVO'`: el
tipo no se toma del body, así que nadie puede registrarse como admin. La
respuesta (201) devuelve el usuario **sin** el hash de la contraseña.

**`login`**

| Situación                                 | Status                                                  |
| ----------------------------------------- | ------------------------------------------------------- |
| Falta email o contraseña                  | 422                                                     |
| Email inexistente o contraseña incorrecta | 401 (mismo mensaje, para no revelar si el email existe) |
| Usuario `INACTIVO`                        | 403 "Tu cuenta está desactivada."                       |
| Todo bien                                 | 200 con `{ token }`                                     |

El JWT lleva `idUser`, `emailUser` y `typeUser`, y expira a la **hora**.
Todos los controllers sacan el `idUser` de `req.user`, nunca del body: así un
usuario no puede operar sobre reservas ajenas.

---

## 6. Rutas

Los routers se montan todos en `/` salvo el de autenticación. Las rutas de admin
**no** llevan prefijo `/admin`.

### 6.1 `auth.js` → `/auth`

| Método | Ruta             | Acceso  |
| ------ | ---------------- | ------- |
| POST   | `/auth/register` | público |
| POST   | `/auth/login`    | público |

### 6.2 `usuarioRoute.js`

| Método | Ruta                      | Acceso      |
| ------ | ------------------------- | ----------- |
| POST   | `/usuarios/createReserve` | token       |
| PATCH  | `/reservas/:id/cancelar`  | token       |
| GET    | `/reservas/mis-reservas`  | token       |
| GET    | `/canchas/verCanchas`     | **público** |
| GET    | `/usuarios/me`            | token       |
| PUT    | `/usuarios/me`            | token       |

`GET /canchas/verCanchas` es el catálogo público: es lo primero que ve alguien
que entra al sitio, así que no puede exigir sesión. Con `verifyToken`, un
visitante sin cuenta veía la home y la pantalla de canchas vacías. El ABM de
canchas sigue siendo admin-only, en `adminRoute.js`.

### 6.3 `adminRoute.js` (todas con `verifyToken` + `isAdmin`)

| Método | Ruta                   | Controller           |
| ------ | ---------------------- | -------------------- |
| GET    | `/seeUsers`            | `seeUsers`           |
| GET    | `/seeReserves`         | `seeReserves`        |
| GET    | `/seeCourts`           | `seeCourts`          |
| GET    | `/pagos`               | `seePayments`        |
| PATCH  | `/usuarios/:id/estado` | `updateUserState`    |
| DELETE | `/usuarios/:id`        | `deleteUser`         |
| POST   | `/canchas`             | `createCourt`        |
| PUT    | `/canchas/:id`         | `updateCourt`        |
| PATCH  | `/canchas/:id/estado`  | `updateCourtState`   |
| DELETE | `/canchas/:id`         | `deleteCourt`        |
| PATCH  | `/reservas/:id/estado` | `updateReserveState` |
| DELETE | `/reservas/:id`        | `deleteReserve`      |

### 6.4 `horarioRoute.js`, `localidadRoute.js`, `servicioRoute.js`

Los tres siguen el mismo patrón: el `GET` del listado es público (lo necesita el
formulario de reserva) y el ABM es admin-only.

| Método              | Ruta                                | Acceso  |
| ------------------- | ----------------------------------- | ------- |
| GET                 | `/horarios`                         | público |
| POST / PUT / DELETE | `/horarios` · `/horarios/:id`       | admin   |
| GET                 | `/localidades`                      | público |
| POST / PUT / DELETE | `/localidades` · `/localidades/:id` | admin   |
| GET                 | `/servicios`                        | público |
| POST / PUT / DELETE | `/servicios` · `/servicios/:id`     | admin   |

### 6.5 `pagoRoute.js`

| Método | Ruta                                  | Acceso       | Uso                                                                                         |
| ------ | ------------------------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| POST   | `/reserves/:idReserve/pago`           | token        | Crea la preferencia y devuelve el link de checkout                                          |
| POST   | `/reserves/:idReserve/pago/confirmar` | token        | Confirma el pago cuando el usuario vuelve del checkout (le manda el `payment_id` de la URL) |
| GET    | `/reserves/:idReserve/pago`           | token        | Estado del pago + la reserva completa                                                       |
| POST   | `/reservas/sincronizar-pagos`         | token        | Pone al día las reservas pendientes del usuario contra MercadoPago                          |
| POST   | `/pagos/webhook`                      | **sin auth** | Notificaciones automáticas: las manda MercadoPago, no el usuario                            |

`POST /reservas/sincronizar-pagos` lo usa la pantalla "Mis reservas" para que un
pago aprobado se vea aunque el webhook nunca haya llegado (por ejemplo,
corriendo el backend en localhost).

---

## 7. Controllers

### 7.1 `canchaController.js`

**`seeCourtsWithHoraries`** (`GET /canchas/verCanchas`) — devuelve solo las
canchas `DISPONIBLE`, con los horarios anidados (alias `Horarios`, atributos
acotados) y la localidad. Acepta `?typeCourt=`. Con una sola llamada el
formulario de reserva tiene todo lo que necesita.

**`createCourt`** — obligatorios los cinco campos; `nameCourt` pasa por
`validarTextos`; `hourlyPrice` y `capacityPlayers` tienen que ser enteros > 0;
la localidad tiene que existir (404 si no). La cancha se crea siempre como
`DISPONIBLE`.

**`updateCourt`** — un PUT sin ningún campo responde 400 en vez de decir
"actualizada exitosamente" sin cambiar nada (Sequelize ignora los `undefined`).

**`updateCourtState`** — alterna `DISPONIBLE ↔ OCUPADO`. El nuevo valor lo
decide el backend; el frontend solo dispara el `PATCH`.

**`deleteCourt`** — responde **409** si la cancha tiene horarios configurados.
Los horarios no son reservas: son las franjas de esa cancha. Se bloquea el
borrado porque la FK está en `ON DELETE CASCADE` y arrastraría también las
reservas de esos horarios. El mensaje sugiere borrar primero los horarios, o
deshabilitar la cancha si solo se la quiere sacar de circulación.

### 7.2 `horarioController.js`

`VALID_DAYS` son los siete días en castellano; `TIME_REGEX` acepta `HH:MM` o
`HH:MM:SS`. `normalizeTime` pasa `"08:00"` a `"08:00:00"`, que es el formato con
el que MySQL compara los `TIME`.

**`seeHoraries`** (`GET /horarios`) — filtros opcionales `idCourt`, `day`, `from`
y `to`. `from`/`to` acotan por **hora de inicio**, con `from` inclusive y `to`
exclusivo, para no tener que listar todos los horarios de una cancha de una sola
vez. Valida el formato de las horas y que `from < to`. Ordena por día y hora.

**`createHorary`** — valida campos obligatorios, día del ENUM, formato de hora,
`startTime < endTime` y que la cancha exista. Después busca cualquier horario de
esa cancha y ese día cuyo rango **se solape** con el nuevo
(`startTime < endTime_nuevo AND endTime > startTime_nuevo`) y responde 409 si lo
encuentra.

**`updateHorary`** — responde **409 si el horario ya tiene reservas**: cambiarlo
dejaría esas reservas apuntando a una franja distinta de la que se reservó. Si
no las tiene, hace un merge con los valores actuales (`?? horary.xxx`) para
poder actualizar campos sueltos, y vuelve a chequear el solapamiento
excluyéndose a sí mismo (`idHorary != id`).

**`deleteHorary`** — 409 si el horario tiene reservas asociadas, indicando
cuántas.

### 7.3 `reserveController.js`

**`createReserve`** (`POST /usuarios/createReserve`) es la lógica más densa del
backend. El `idUser` sale del JWT, nunca del body. El orden es:

1. Campos obligatorios (`typeCourt`, `idLocateCourt`, `dateReserve`, `day`,
   `idHorary`) → 400.
2. `dateReserve` con formato `AAAA-MM-DD` y que sea una fecha real → 400.
3. Que no sea una fecha pasada → 400.
4. Que el día de la semana declarado coincida con el que realmente cae esa fecha
   → 400 ("La fecha ingresada corresponde a un Martes, no a un Lunes").
5. **Se busca primero el horario, y de ahí se deriva la cancha.** Un horario
   pertenece a una sola cancha (`Horarios.idCourt`), así que el horario elegido
   ya determina la cancha. Antes se la adivinaba con un `findOne` sobre
   tipo + localidad, que devolvía siempre la primera y dejaba al resto de las
   canchas imposibles de reservar.
6. La cancha se busca por su PK, sin ambigüedad posible. Tipo y localidad ya no
   sirven para **buscar** la cancha, sino para **validar** que la cancha del
   horario es efectivamente la que pidió el usuario → 400 si no coinciden.
7. La cancha tiene que estar `DISPONIBLE` → 409.
8. Si la reserva es para **hoy**, además hay que comparar la **hora**: sin esto
   se podían reservar franjas del día de hoy que ya habían pasado (y que después
   no se podían cancelar, por la regla de las 6 horas) → 400.
9. Que no haya otra reserva no cancelada para esa cancha, ese horario y esa
   fecha → 409.
10. `totalAmount` = precio por hora de la cancha + suma de los servicios
    elegidos. Si algún servicio no existe → 404.
11. Se crea la reserva en estado `pendiente`, se asocian los servicios y se
    devuelve (201) la reserva completa con cancha, horario y servicios.

**`cancelReserve`** (`PATCH /reservas/:id/cancelar`)

| Situación                                 | Status                                         |
| ----------------------------------------- | ---------------------------------------------- |
| Reserva inexistente                       | 404                                            |
| No es del usuario logueado                | 403                                            |
| No está `pendiente`                       | 400 "Solo podés cancelar reservas pendientes." |
| Faltan menos de **6 horas** para el turno | 400                                            |
| Todo bien                                 | 200, pasa a `cancelada`                        |

La anticipación se calcula combinando `dateReserve` con el `startTime` del
horario.

**`seeMyReserves`** (`GET /reservas/mis-reservas`) — reservas del usuario
logueado, con cancha y horario incluidos, y filtro opcional `?stateReserva=`.

**`updateReserveState`** (admin) — valida que el estado esté entre los tres del
ENUM antes de tocar nada.

**`deleteReserve`** (admin) — responde 409 si la reserva tiene un pago asociado
(`paymentId`): borrarla dejaría el pago huérfano.

### 7.4 `localidadController.js` y `servicioController.js`

Mismo esqueleto en los dos: listado público, ABM admin.

- Los campos de texto pasan por `validarTextos` y se guardan con `.trim()`.
- `priceService` tiene que ser entero > 0.
- Un `PUT` sin ningún campo responde 400, por el mismo motivo que en canchas:
  Sequelize ignora los `undefined` y la respuesta decía "actualizada
  exitosamente" sin haber cambiado nada.
- **Borrado con dependencias → 409**: una localidad con canchas asociadas, o un
  servicio usado en alguna reserva (se cuenta sobre `reservaServicios`), no se
  pueden eliminar.

### 7.5 `usuarioController.js`

`EDITABLE_FIELDS = ["nameUser", "surnameUser", "dateUser", "aliasUser"]`. El
email y el tipo de usuario quedan afuera a propósito: el email identifica la
cuenta en el login y el tipo solo lo cambia un administrador. Esa lista se pasa
como `{ fields: EDITABLE_FIELDS }` en el `update`, así que aunque llegaran otros
campos en el body no se escribirían.

- **`getMyProfile`** — excluye `passwordUser` de la respuesta.
- **`updateMyProfile`** — exige los cuatro campos y aplica `validateBirthDate`,
  la misma validación que en el registro, para que no se pueda esquivar
  guardando una fecha imposible desde la pantalla de perfil. La respuesta
  también va sin el hash.

### 7.6 `adminController.js`

**`seeUsers`** — solo los `CLIENTE`, sin el hash de la contraseña.

**`seeReserves`** y **`seeCourts`** — validan los valores de los filtros contra
las listas permitidas antes de consultar. Un valor fuera del ENUM devolvía una
lista vacía, como si simplemente no hubiera registros; conviene avisar que el
filtro está mal escrito (400).

> Un listado sin resultados **no es un error**: es una lista vacía con 200.
> Devolver 404 obligaba al frontend a tratar el "no hay nada" como excepción.
> Esta decisión es la contraparte del helper `emptyOn404` del frontend.

**`updateUserState`** — alterna `ACTIVO ↔ INACTIVO`. Un usuario `INACTIVO` no
puede iniciar sesión (§5.2).

**`deleteUser`** — 409 si el usuario tiene reservas asociadas, sugiriendo
desactivarlo en su lugar.

---

## 8. Pagos con MercadoPago (`pagoController.js`)

Es la parte con más decisiones no obvias, casi todas motivadas por dos límites
de MercadoPago.

### 8.1 Las dos restricciones de fondo

**MercadoPago solo acepta `back_urls` https.** Con http (incluso con un dominio
público, no solo con localhost) la API responde **201 pero devuelve las
`back_urls` vacías, sin ningún error**: el checkout queda sin botón "Volver al
sitio" y el usuario se queda varado en la pantalla de MercadoPago. Con
`auto_return` encima responde 400.

Por eso se decide de antemano, en `canAutoReturn = FRONTEND_URL.startsWith("https://")`,
en vez de mandarlas y ver qué pasa: si no podemos volver, el frontend necesita
saberlo para abrir el checkout en otra pestaña y esperar el resultado desde la
suya. Si `canAutoReturn` es `false` se loguea un warning al arrancar explicando
cómo exponer el frontend por https (ngrok, cloudflared).

**El webhook necesita una URL pública.** MercadoPago no puede llamar a
localhost, así que `notification_url` solo se manda si `BACKEND_URL` está
definida y no apunta a localhost. Sin webhook, la confirmación queda a cargo del
frontend al volver del checkout y de la sincronización manual.

### 8.2 `createPreference` — `POST /reserves/:idReserve/pago`

Chequeos previos: la reserva existe (404), es del usuario logueado (403), no
está ya `confirmada` (409) ni `cancelada` (409).

El body de la preferencia lleva:

- un único ítem con el `totalAmount` de la reserva en ARS;
- `external_reference` con el id de la reserva, que es lo que permite
  identificarla cuando llega el webhook;
- `back_urls` y `auto_return: "approved"` **solo si** `canAutoReturn`. Sin
  `auto_return`, MercadoPago deja al usuario en su propia pantalla final en vez
  de devolverlo solo a CanchaYa.

Las `back_urls` apuntan a `/pago/exito`, `/pago/error` y `/pago/pendiente`, y
llevan `?reserva=<id>` en la query: si MercadoPago no manda `external_reference`
al volver, el frontend igual sabe de qué reserva se trata.

Si la creación falla **y** se había mandado `auto_return`, hay una red de
seguridad: se reintenta sin `auto_return` pero **conservando** las `back_urls`,
así al menos queda el botón "Volver al sitio" en vez de dejar al usuario sin
salida. Cubre el caso de una URL https pero mal formada.

La respuesta devuelve `id`, `init_point` (link real), `sandbox_init_point` (link
de pruebas) y `autoReturn`, que le dice al frontend si MercadoPago va a devolver
al usuario por su cuenta.

### 8.3 `syncReserveWithMercadoPago` (interna)

Busca en MercadoPago los pagos hechos contra una reserva y actualiza su estado.
Hace falta porque en desarrollo local MercadoPago no puede llamar al webhook y,
si el usuario cierra la pestaña antes de volver, la reserva se quedaría en
`pendiente` para siempre aunque el pago esté aprobado.

- No hace nada si falta `MP_ACCESS_TOKEN` o si la reserva ya está `confirmada` o
  `cancelada`.
- Busca por `external_reference`, ordenado por fecha descendente. Si hubo varios
  intentos, se queda con el **aprobado**; si no hay ninguno aprobado, con el más
  reciente.
- Solo guarda si algo cambió, y pasa la reserva a `confirmada` únicamente cuando
  el pago está `approved`.
- Devuelve `true` si la reserva cambió.

### 8.4 `syncMyPayments` — `POST /reservas/sincronizar-pagos`

Recorre las reservas `pendiente` del usuario y las sincroniza una por una. Si
MercadoPago falla para alguna, se loguea y **se sigue con las demás**: un error
puntual no puede frenar la puesta al día del resto. Devuelve
`{ checked, updated }`.

### 8.5 `webhook` — `POST /pagos/webhook`

MercadoPago puede mandar la notificación por query params o por body, así que se
leen las dos formas (`type` / `data.id`). Si la notificación no es de tipo
`payment`, o no se puede resolver la reserva, responde 200 y listo.

Cuando el pago está `approved` la reserva pasa a `confirmada`. Si fue rechazado,
la reserva queda `pendiente` y el usuario puede reintentar.

**Siempre responde 200, incluso ante un error.** Con cualquier otro status
MercadoPago reintenta la notificación indefinidamente.

### 8.6 `confirmPayment` — `POST /reserves/:idReserve/pago/confirmar`

MercadoPago agrega `?payment_id=...` a la back_url y el frontend lo manda acá.
Es lo que hace funcionar el flujo en desarrollo local, donde el webhook no puede
llegar.

El pago se consulta **directamente contra MercadoPago**: nunca se confía en lo
que manda el frontend. Además se verifica que el `external_reference` del pago
coincida con la reserva (400 si no), para que nadie confirme una reserva con el
`payment_id` de otra.

### 8.7 `getPaymentStatus` — `GET /reserves/:idReserve/pago`

Devuelve el estado **más la reserva completa**: se traen cancha (con su
localidad), horario y servicios porque con eso el frontend arma la pantalla de
"reserva confirmada" sin tener que pedir la reserva aparte.

Antes de contestar llama a `syncReserveWithMercadoPago`, así el estado que ve el
usuario es el real aunque el webhook nunca haya llegado. Si esa sincronización
falla, se loguea y se responde igual con lo que hay en la base.

### 8.8 `seePayments` — `GET /pagos` (admin)

Lista las reservas que ya tienen un intento de pago (`paymentId != null`), con
filtro opcional `?paymentStatus=`.

---

## 9. Scripts (`scripts/`)

Los tres se corren con `node --env-file=.env`, que es lo que arman los scripts
de `package.json`.

### 9.1 `crearAdmin.mjs` — `npm run crear-admin -- <email> <password> [nombre] [apellido]`

Hace falta porque el ABM de canchas exige `isAdmin` y el registro público fuerza
`typeUser: 'CLIENTE'`. Sin esto no hay forma de entrar al panel de
administración.

Valida que estén el email y la contraseña, que el email tenga `@` y que la
contraseña tenga al menos 8 caracteres. Si el email ya existe, **lo promueve a
ADMIN** y le actualiza la contraseña; si no, crea el usuario con
`dateUser: "01/01/1990"` (el modelo exige el formato `dd/mm/aaaa`) y el alias
derivado del email.

### 9.2 `seedData.mjs` — `npm run cargar-datos`

Carga localidades, canchas, horarios y servicios de prueba.

Es **idempotente**: usa `findOrCreate` por el campo "natural" de cada entidad
(`nomLocation`, `nameCourt`, `idCourt + day + startTime`, `nameService`), así que
correrlo varias veces no duplica filas ya existentes.

**No toca Usuarios ni Reservas**: ya hay cuentas y reservas reales cargadas (con
contraseñas hasheadas y fechas/pagos encadenados) y tocarlas a ciegas podía
romper algo. Si hace falta, se agrega en un script aparte.

Las canchas se referencian por nombre de localidad y se resuelven a `idLocation`
en tiempo de ejecución; si la localidad no existe, saltea esa cancha con un
warning. Hay dos juegos de horarios: `NEW_COURT_SLOTS` para las canchas que
carga el script, y `EXISTING_COURT_SLOTS` para las dos que ya existían
("Campus Rosario" y "El Punto"), con franjas elegidas para no pisar las que ya
tenían.

### 9.3 `revisarDb.mjs` — `npm run revisar-db`

Diagnóstico de **solo lectura**: no escribe ni modifica nada. Chequea las dos
cosas que rompen el ABM de canchas en silencio:

1. Que `Canchas.idCourt` sea `AUTO_INCREMENT`. Si no lo es, `POST /canchas`
   falla; el script imprime el `ALTER TABLE` que lo arregla.
2. Que la tabla de localidades se llame como dice el modelo (`Localidads`). Si
   no, el select de sede queda vacío y no se puede crear ninguna cancha; el
   script imprime el `RENAME TABLE` o sugiere cambiar el `tableName`. La
   comparación se hace sin distinguir mayúsculas porque en Windows MySQL guarda
   los nombres en minúscula.

También avisa si la tabla existe pero está vacía (sin sedes no se pueden crear
canchas, la sede es obligatoria). Sale con código 1 si detectó problemas.

---

## 10. Variables de entorno

`.env.example` documenta cada variable con el detalle de cómo obtenerla; ese
archivo **sí conserva sus comentarios**, porque son las instrucciones de
instalación de quien clona el repo.

| Variable                                                  | Para qué                                                                                                     |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión MySQL                                                                                               |
| `JWT_SECRET`                                              | Firma de los tokens de sesión                                                                                |
| `MP_ACCESS_TOKEN`                                         | Credencial de MercadoPago                                                                                    |
| `FRONTEND_URL`                                            | A dónde vuelve el usuario después de pagar. **Tiene que ser https** para que la vuelta sea automática (§8.1) |
| `BACKEND_URL`                                             | URL pública del backend para el webhook. En localhost se ignora                                              |
| `PORT`                                                    | Lo asigna la plataforma de hosting; en local cae a 3000                                                      |

---

## 11. Deudas conocidas

Cosas que quedaron identificadas y no se tocaron, para no cambiar
comportamiento:

- **`verifyToken` está duplicado** en `verifyToken.js` y `verifyAdmin.js` (§5.1).
- **`priceService` es `INTEGER` en el modelo y `decimal(5,2)` en la base**
  (§3.5): el tope real son 999.99.
- **La validación `len` de `passwordUser`** nunca dispara porque corre sobre el
  hash (§3.1); la longitud real la valida el controller.
- **`GET /canchas/verCanchas` no filtra por sede**: el backend solo filtra por
  `typeCourt`, y el filtro por `idLocateCourt` lo aplica el frontend en memoria.
- **El nombre de tabla `Localidads`** quedó como lo generó Sequelize; renombrarlo
  implica migrar la base.
