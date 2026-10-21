# Documentación de la API REST - CanchaYa

API REST en JSON hecha con Express 5. Corre por defecto en `http://localhost:3000`.

- Todas las peticiones y respuestas usan `Content-Type: application/json`.
- Las fechas de reserva van como `AAAA-MM-DD`; la fecha de nacimiento, como `dd/mm/aaaa`; las horas, como `HH:MM` o `HH:MM:SS`.
- Los montos son números enteros en pesos.

## Índice

1. [Autenticación y niveles de acceso](#1-autenticación-y-niveles-de-acceso)
2. [Errores](#2-errores)
3. [Auth](#3-auth--auth)
4. [Perfil del usuario](#4-perfil-del-usuario)
5. [Catálogo público](#5-catálogo-público)
6. [Reservas del cliente](#6-reservas-del-cliente)
7. [Pagos con Mercado Pago](#7-pagos-con-mercado-pago)
8. [Administración de complejo (ADMIN y SUPERADMIN)](#8-administración-de-complejo-admin-y-superadmin)
9. [Administración de la plataforma (SUPERADMIN)](#9-administración-de-la-plataforma-superadmin)

---

## 1. Autenticación y niveles de acceso

El login devuelve un **JWT** que dura **1 hora**. Las rutas protegidas lo esperan en el header:

```
Authorization: Bearer <token>
```

El token lleva en su payload `idUser`, `emailUser` y `typeUser`. Está firmado con `JWT_SECRET`: el cliente puede leerlo, pero no modificarlo sin invalidar la firma.

| Nivel | Quién es | Qué puede hacer |
|:-|:-|:-|
| Público | Cualquiera, sin token | Ver el catálogo, registrarse, iniciar sesión, recuperar la contraseña |
| `CLIENTE` | Cualquier usuario registrado | Reservar, pagar, ver y cancelar sus reservas, editar su perfil |
| `ADMIN` | Administrador de **un** complejo | Gestionar canchas, horarios, reservas y pagos **de su complejo** |
| `SUPERADMIN` | Dueño de la plataforma | Todo lo anterior en todos los complejos, más localidades, servicios, complejos y usuarios |

En las tablas, **Acceso** indica el nivel mínimo:

- **público**: sin token.
- **token**: cualquier usuario logueado.
- **admin de complejo**: `ADMIN` o `SUPERADMIN`. El `ADMIN` solo puede operar sobre recursos de su complejo; si intenta tocar otro, recibe `403`.
- **superadmin**: solo `SUPERADMIN`.

El registro público siempre crea `CLIENTE`. Los `ADMIN` los da de alta el superadmin con [`POST /admins`](#post-admins), y el superadmin se crea con `npm run crear-superadmin`.

---

## 2. Errores

Los errores responden con un código HTTP y un JSON con el mensaje. Casi todos los endpoints lo devuelven en `error`; los de login, pagos y los middlewares de autenticación lo devuelven en `message`:

```json
{ "error": "La cancha indicada no existe." }
```

| Código | Cuándo |
|:-|:-|
| `400` | Datos inválidos o faltantes, JSON mal formado, regla de negocio no cumplida |
| `401` | Sin token, token inválido o vencido (`{ "message": "Token no proporcionado" }` / `"Token inválido"`), o credenciales incorrectas en el login |
| `403` | El usuario está logueado pero no tiene permiso: rol insuficiente, recurso de otro complejo o de otro usuario, cuenta desactivada o mail sin verificar |
| `404` | El recurso no existe. Una ruta inexistente también responde `404` en JSON |
| `409` | Conflicto con datos existentes: duplicado, horario ya reservado, o no se puede borrar porque tiene registros asociados |
| `422` | Login sin email o sin contraseña |
| `500` | Error interno. No expone detalles de la base |

---

## 3. Auth (`/auth`)

### `POST /auth/register`
Crea un usuario `CLIENTE` sin verificar y le manda por mail un código de 6 dígitos que vence en 10 minutos. **Acceso:** público.

```json
{
  "nameUser": "Ana",
  "surnameUser": "Pérez",
  "emailUser": "ana@mail.com",
  "dateUser": "14/05/2000",
  "passwordUser": "minimo8caracteres",
  "aliasUser": "anap"
}
```

Reglas: todos los campos son obligatorios y de tipo texto, el email tiene que tener formato válido, la contraseña al menos 8 caracteres y la persona al menos 16 años.

| Respuesta | Body |
|:-|:-|
| `201` | `{ "message": "Te enviamos un código a ana@mail.com.", "user": { ...usuario sin contraseña } }` |
| `201` | Si el mail no se pudo enviar, el usuario igual queda creado: `{ "message": "El usuario se creó pero no se pudo enviar el mail. Pedí un código nuevo.", "user": {...} }` |
| `400` | Validación fallida o `"El mail ya está registrado."` |

### `POST /auth/verifyemail`
Verifica la cuenta con el código recibido por mail. **Acceso:** público.

```json
{ "emailUser": "ana@mail.com", "code": "042193" }
```

| Respuesta | Body |
|:-|:-|
| `200` | `{ "message": "Usuario verificado." }` |
| `400` | Formato inválido, código incorrecto o vencido, o usuario ya verificado |
| `403` | `"Demasiados intentos, pedí un código nuevo."` (después de 5 intentos fallidos) |

### `POST /auth/resend`
Reenvía el código de verificación. Si se pidió uno hace menos de 60 segundos, no manda otro. **Acceso:** público.

```json
{ "emailUser": "ana@mail.com" }
```

| Respuesta | Body |
|:-|:-|
| `200` | Siempre el mismo mensaje genérico, exista o no la cuenta, para no revelar qué emails están registrados |
| `400` | Formato de email inválido |

### `POST /auth/login`
**Acceso:** público.

```json
{ "emailUser": "ana@mail.com", "passwordUser": "minimo8caracteres" }
```

| Respuesta | Body |
|:-|:-|
| `200` | `{ "token": "eyJhbGciOi..." }` |
| `401` | `{ "message": "Credenciales inválidas" }`: mismo mensaje si el email no existe o si la contraseña es incorrecta |
| `403` | `{ "message": "Tu cuenta está desactivada. Contactá al administrador." }` |
| `403` | `{ "error": "Debes verificar tu email para iniciar sesión.", "code": "EMAIL_NO_VERIFICADO" }` |
| `422` | `{ "message": "Email y contraseña requeridos" }` |

### `POST /auth/forgotpassword`
Manda un código para restablecer la contraseña. **Acceso:** público.

```json
{ "emailUser": "ana@mail.com" }
```

| Respuesta | Body |
|:-|:-|
| `200` | Mensaje genérico, exista o no la cuenta |
| `400` | Formato de email inválido |

### `POST /auth/resetpass`
Cambia la contraseña con el código recibido. **Acceso:** público.

```json
{ "emailUser": "ana@mail.com", "code": "518306", "newPassword": "nuevaClave123" }
```

| Respuesta | Body |
|:-|:-|
| `200` | `{ "message": "Contraseña cambiada con éxito." }` |
| `400` | Formato inválido, contraseña de menos de 8 caracteres, código incorrecto o vencido |
| `403` | Demasiados intentos |

---

## 4. Perfil del usuario

### `GET /usuarios/me`
Devuelve los datos del usuario logueado, sin la contraseña. **Acceso:** token.

### `PUT /usuarios/me`
Edita el perfil propio. El email, el rol y la contraseña no se pueden cambiar por acá. **Acceso:** token.

```json
{ "nameUser": "Ana", "surnameUser": "Pérez", "dateUser": "14/05/2000", "aliasUser": "anita" }
```

| Respuesta | Body |
|:-|:-|
| `200` | `{ "message": "Perfil actualizado correctamente.", "user": {...} }` |
| `400` | Falta algún campo, no es texto o la fecha de nacimiento es inválida |

---

## 5. Catálogo público

Endpoints sin token: los usa el formulario de reserva y la home.

| Método | Ruta | Filtros (query) | Devuelve |
|:-|:-|:-|:-|
| `GET` | `/canchas/verCanchas` | `typeCourt`, `idComplex`, `idLocation` | Canchas **disponibles**, cada una con sus `horaries` y su `complex` (con `location`) |
| `GET` | `/localidades` | - | Todas las localidades |
| `GET` | `/servicios` | - | Todos los servicios adicionales |
| `GET` | `/horarios` | `idCourt`, `day`, `from`, `to` (franja horaria) | Horarios ordenados por día y hora |
| `GET` | `/complejos` | `idLocation` | Complejos con su localidad |
| `GET` | `/complejos/:id` | - | Un complejo con su localidad y sus canchas (`404` si no existe) |

`typeCourt` acepta `FUTBOL`, `TENIS` o `PADEL`. `day` acepta `Lunes` a `Domingo`. En `/horarios`, `from` tiene que ser anterior a `to`, si no responde `400`.

Ejemplo de una cancha de `/canchas/verCanchas`:

```json
{
  "idCourt": 3,
  "typeCourt": "PADEL",
  "nameCourt": "Pádel 1",
  "hourlyPrice": 18000,
  "stateCourt": "DISPONIBLE",
  "capacityPlayers": 4,
  "idComplex": 1,
  "horaries": [{ "idHorary": 12, "day": "Lunes", "startTime": "18:00:00", "endTime": "19:00:00" }],
  "complex": {
    "idComplex": 1,
    "nameComplex": "Complejo Centro",
    "addressComplex": "San Martín 1200",
    "idLocation": 1,
    "location": { "idLocation": 1, "nomLocation": "Rosario", "nameCountry": "Argentina" }
  }
}
```

---

## 6. Reservas del cliente

### `POST /usuarios/createReserve`
Crea una reserva en estado `pendiente`. El usuario sale del token, y el total lo calcula el backend (precio de la cancha + servicios): no se acepta del cliente. **Acceso:** token.

```json
{
  "typeCourt": "PADEL",
  "idLocation": 1,
  "dateReserve": "2026-10-20",
  "day": "Martes",
  "idHorary": 12,
  "services": [1, 3]
}
```

`services` es opcional.

| Respuesta | Body |
|:-|:-|
| `201` | `{ "message": "Reserva creada exitosamente.", "reserve": { ...reserva con court, horary y services } }` |
| `400` | Faltan datos; fecha inválida o pasada; el día no coincide con la fecha; el horario no corresponde a ese día, tipo de cancha o localidad; el horario de hoy ya pasó |
| `404` | El horario, la cancha o algún servicio no existe |
| `409` | La cancha no está disponible, o ese horario ya está reservado para esa fecha |

### `GET /reservas/mis-reservas`
Las reservas del usuario logueado, con la cancha (complejo y localidad) y el horario. Filtro opcional: `?stateReserva=pendiente|confirmada|cancelada`. **Acceso:** token.

### `GET /reservas/:id`
Detalle completo de una reserva: cancha, complejo, localidad, horario, servicios y cliente. **Acceso:** token. La ve su dueño, el admin del complejo de esa cancha o el superadmin; cualquier otro recibe `403`.

### `PATCH /reservas/:id/cancelar`
Cancela una reserva propia. **Acceso:** token.

| Respuesta | Body |
|:-|:-|
| `200` | `{ "message": "Reserva cancelada exitosamente." }` |
| `400` | La reserva no está `pendiente`, o faltan menos de 6 horas para el turno |
| `403` | La reserva es de otro usuario |
| `404` | La reserva no existe |

---

## 7. Pagos con Mercado Pago

El flujo es: **crear la reserva** → **crear la preferencia** → el usuario paga en Mercado Pago → el backend **confirma el pago consultando a Mercado Pago**. Nunca se confía en lo que manda el frontend: el estado del pago siempre se lee de la API de Mercado Pago con `MP_ACCESS_TOKEN`.

Una reserva pasa a `confirmada` solo si estaba `pendiente`. Una reserva cancelada no se reactiva aunque llegue un pago aprobado, porque su horario ya pudo haberlo tomado otra persona.

| Método | Ruta | Acceso | Body | Respuesta |
|:-|:-|:-|:-|:-|
| `POST` | `/reserves/:idReserve/pago` | token (dueño) | `{ "metodo": "MERCADO_PAGO" \| "EFECTIVO" }` (opcional, por defecto `MERCADO_PAGO`) | `{ id, init_point, sandbox_init_point, autoReturn }`: `init_point` es el link al checkout. `409` si la reserva no está pendiente |
| `POST` | `/reserves/:idReserve/pago/confirmar` | token (dueño) | `{ "payment_id": "123" }` | `{ message, stateReserva, paymentStatus }`. `400` si el pago no corresponde a esa reserva |
| `GET` | `/reserves/:idReserve/pago` | token (dueño) | - | La reserva completa, sincronizada antes con Mercado Pago |
| `POST` | `/reservas/sincronizar-pagos` | token | - | `{ checked, updated, expired }`: pone al día las reservas pendientes del usuario y vence las que pasaron el plazo |
| `POST` | `/pagos/webhook` | **sin token** | Notificación de Mercado Pago (`type=payment`, `data.id`) | Siempre `200`. Se usa solo el id del pago: el estado se consulta a Mercado Pago |

En los tres primeros, si la reserva es de otro usuario responde `403`, y si no existe, `404`.

### Vencimiento de las reservas sin pagar

Una reserva `pendiente` retiene el horario **30 minutos** desde que se crea (`createdReserve`). La preferencia de Mercado Pago vence a la misma hora (`expiration_date_to`), así que pasado el plazo el checkout ya no acepta pagos, y `POST /reserves/:idReserve/pago` responde `409`.

Cinco minutos después del plazo (margen para un pago que arrancó justo antes) la reserva pasa a `vencida` y el horario queda libre. Antes de vencerla se consulta a Mercado Pago: si el pago se aprobó, se confirma; si está en curso (`pending`, `in_process`…), se espera. Se revisa:

- cada 5 minutos, con una tarea que arranca junto con el servidor (`server.js`);
- al crear una reserva, para ese horario puntual;
- en `POST /reservas/sincronizar-pagos` (respuesta con `expired`) y en `GET /reserves/:idReserve/pago`.

### Pago en efectivo con seña

Con `metodo: "EFECTIVO"` la preferencia no cobra el total sino una **seña del 25 %** (redondeada hacia arriba). Cuando la seña se aprueba, la reserva pasa a `confirmada` con `paymentMethod: "EFECTIVO"` y `depositAmount` = lo que se pagó. El resto (`totalAmount - depositAmount`) se abona en efectivo en el complejo, y el admin lo registra con `PATCH /reservas/:id/pago-efectivo` (ver [sección 8](#reservas-y-pagos)), que completa `cashPaidAt` y `cashRegisteredBy`.

Una reserva señada ya no está `pendiente`, así que el cliente no la puede cancelar desde la app: la seña asegura el turno y no se devuelve. Si el cliente no se presenta, el admin la pasa a `ausente`.

---

## 8. Administración de complejo (ADMIN y SUPERADMIN)

**Acceso:** admin de complejo. El `ADMIN` ve y modifica solo lo de su complejo; el `SUPERADMIN`, todo. Un `ADMIN` sin complejo asignado recibe `403` en estas rutas.

### Mi complejo

| Método | Ruta | Descripción |
|:-|:-|:-|
| `GET` | `/mi-complejo` | El complejo del admin logueado, con su localidad y sus canchas. `404` si no tiene uno asignado |
| `PUT` | `/complejos/:id` | El `ADMIN` solo puede cambiar `nameComplex` y `addressComplex` de su complejo. Ver la versión de superadmin en la [sección 9](#complejos) |

### Canchas

| Método | Ruta | Body / filtros | Respuesta |
|:-|:-|:-|:-|
| `GET` | `/seeCourts` | `?typeCourt`, `?stateCourt` (`DISPONIBLE`/`OCUPADO`), `?idComplex` (solo superadmin) | Canchas con su complejo y localidad |
| `POST` | `/canchas` | `{ typeCourt, nameCourt, hourlyPrice, capacityPlayers, idComplex }` | `201` con la cancha creada en estado `DISPONIBLE` |
| `PUT` | `/canchas/:id` | Cualquier subconjunto de los campos del alta | `200 { message, court }` |
| `PATCH` | `/canchas/:id/estado` | - | Alterna entre `DISPONIBLE` y `OCUPADO` |
| `DELETE` | `/canchas/:id` | - | `200`, o `409` si la cancha tiene horarios configurados |

- `hourlyPrice` y `capacityPlayers` tienen que ser enteros mayores a 0.
- El `ADMIN` puede omitir `idComplex`: se usa su complejo. El superadmin tiene que indicarlo.
- Mover una cancha a otro complejo (`idComplex` en el `PUT`) es solo para el superadmin.

### Horarios

| Método | Ruta | Body | Respuesta |
|:-|:-|:-|:-|
| `POST` | `/horarios` | `{ idCourt, day, startTime, endTime }` | `201` con el horario creado |
| `PUT` | `/horarios/:id` | Cualquier subconjunto de los campos del alta | `200 { message, horary }` |
| `DELETE` | `/horarios/:id` | - | `200` |

Reglas: la hora de inicio tiene que ser anterior a la de fin, y el horario no puede superponerse con otro de la misma cancha y día (`409`). No se puede editar ni borrar un horario que tiene reservas (`409`).

### Reservas y pagos

| Método | Ruta | Body / filtros | Respuesta |
|:-|:-|:-|:-|
| `GET` | `/seeReserves` | `?stateReserva`, `?dateReserve` (`AAAA-MM-DD`) | Reservas con su cancha y horario |
| `PATCH` | `/reservas/:id/estado` | `{ "stateReserva": "pendiente" \| "confirmada" \| "cancelada" \| "ausente" \| "vencida" }` | `200 { message }` |
| `PATCH` | `/reservas/:id/pago-efectivo` | - | `200 { message }`: registra que se cobró en efectivo el resto de una reserva señada. `409` si no es en efectivo, no está `confirmada` o ya estaba registrado |
| `DELETE` | `/reservas/:id` | - | `200`, o `409` si la reserva tiene un pago asociado |
| `GET` | `/pagos` | `?paymentStatus` | Reservas que tienen un pago registrado |

---

## 9. Administración de la plataforma (SUPERADMIN)

**Acceso:** superadmin.

### Localidades

| Método | Ruta | Body | Respuesta |
|:-|:-|:-|:-|
| `POST` | `/localidades` | `{ "nameCountry": "Argentina", "nomLocation": "Rosario" }` | `201`. `409` si ya existe esa localidad en ese país |
| `PUT` | `/localidades/:id` | Uno o los dos campos | `200 { message, location }` |
| `DELETE` | `/localidades/:id` | - | `200`, o `409` si tiene complejos |

### Servicios

| Método | Ruta | Body | Respuesta |
|:-|:-|:-|:-|
| `POST` | `/servicios` | `{ "nameService": "Pecheras", "priceService": 1500, "descriptionService": "Juego de 10" }` | `201` |
| `PUT` | `/servicios/:id` | Cualquier subconjunto de los campos | `200 { message, service }` |
| `DELETE` | `/servicios/:id` | - | `200`, o `409` si el servicio está en alguna reserva |

### Complejos

| Método | Ruta | Body | Respuesta |
|:-|:-|:-|:-|
| `POST` | `/complejos` | `{ nameComplex, addressComplex, idLocation, idAdmin? }` | `201` |
| `PUT` | `/complejos/:id` | Cualquier subconjunto. `"idAdmin": null` desasigna al administrador | `200 { message, complex }` |
| `DELETE` | `/complejos/:id` | - | `200`, o `409` si tiene canchas |

`idAdmin` tiene que ser un usuario `ADMIN` que no administre otro complejo (`409` si ya tiene uno). Un admin administra un solo complejo.

### Usuarios y administradores

| Método | Ruta | Body | Respuesta |
|:-|:-|:-|:-|
| `GET` | `/seeUsers` | - | Los clientes, sin contraseña |
| `PATCH` | `/usuarios/:id/estado` | - | Alterna entre `ACTIVO` e `INACTIVO`. Un usuario inactivo no puede iniciar sesión. No aplica al superadmin (`403`) |
| `DELETE` | `/usuarios/:id` | - | `200`, o `409` si administra un complejo o tiene reservas (en ese caso conviene desactivarlo) |
| `GET` | `/admins` | - | Los administradores, con el complejo que tienen asignado |
| <a id="post-admins"></a>`POST` | `/admins` | Los mismos campos que el registro, más `idComplex` opcional | `201` con el admin creado (ya verificado). Si viene `idComplex`, se lo asigna en la misma transacción |
