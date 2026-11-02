# Evidencia de ejecución de tests automáticos

Salida de los tests unitarios y de integración ejecutados el 01/11/2026. La fecha del test end-to-end está en su sección.

## Backend (Vitest + supertest)

### Tests unitarios

Uno por integrante:

| Test | Autor | Qué prueba |
|:-|:-|:-|
| `tests/birthDate.test.js` | Francisco Gallon | Validación de la fecha de nacimiento en el registro |
| `tests/verifyToken.test.js` | Santiago Martínez | Middleware que protege las rutas con JWT |

Comando: `npx vitest run tests/birthDate.test.js tests/verifyToken.test.js --reporter=verbose`

```
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el pedido no trae token responde 401 y no deja pasar 5ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el header no empieza con Bearer responde 401 3ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el token está firmado con otra clave responde 401 2ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el token está vencido responde 401 1ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el token es válido guarda el usuario en req.user y deja pasar 1ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario no ingresa nada le dice que la fecha de nacimiento es obligatoria 6ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario ingresa un formato inválido de fecha de nacimiento 1ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario ingresa como fecha de nacimiento una fecha futura 0ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario no cumple con la cantidad de año necesarios 0ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario ingresa una fecha de nacimiento fuera del rango 0ms
 Test Files  2 passed (2)
      Tests  10 passed (10)
```

### Test de integración

Levantan la app completa con supertest contra la base de test (`DB_NAME` terminado en `_test`):

| Test | Qué prueba |
|:-|:-|
| `tests/localidades.test.js` | El CRUD de localidades de punta a punta: ruta, token, rol, validación, controller, servicio y MySQL. Comprueba en la base que los pedidos rechazados no guardan nada |
| `tests/app.test.js` | Que una ruta inexistente responda 404 en JSON |

Comando: `npm test -- --reporter=verbose`

Salida de la suite completa (unitarios + integración):

```
 ✓ tests/localidades.test.js > CRUD de localidades > Cuando el pedido no trae token responde 401 y no crea nada 25ms
 ✓ tests/localidades.test.js > CRUD de localidades > Cuando un cliente intenta crear una localidad responde 403 y no crea nada 8ms
 ✓ tests/localidades.test.js > CRUD de localidades > Cuando los datos son inválidos la validación responde 400 y no crea nada 6ms
 ✓ tests/localidades.test.js > CRUD de localidades > Cuando el superadmin crea una localidad la guarda en la base, sin espacios de más 19ms
 ✓ tests/localidades.test.js > CRUD de localidades > Cuando la localidad ya existe responde 409 12ms
 ✓ tests/localidades.test.js > CRUD de localidades > El listado público muestra la localidad creada sin pedir token 8ms
 ✓ tests/localidades.test.js > CRUD de localidades > Cuando se edita un solo campo cambia ese campo y el otro queda igual 24ms
 ✓ tests/localidades.test.js > CRUD de localidades > Cuando se edita una localidad que no existe responde 404 6ms
 ✓ tests/localidades.test.js > CRUD de localidades > Cuando la localidad tiene complejos no se puede eliminar 27ms
 ✓ tests/localidades.test.js > CRUD de localidades > Cuando la localidad no tiene complejos se elimina de la base 11ms
 ✓ tests/app.test.js > App > responde 404 en JSON para una ruta que no existe 20ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el pedido no trae token responde 401 y no deja pasar 3ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el header no empieza con Bearer responde 401 3ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el token está firmado con otra clave responde 401 2ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el token está vencido responde 401 1ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el token es válido guarda el usuario en req.user y deja pasar 2ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario no ingresa nada le dice que la fecha de nacimiento es obligatoria 5ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario ingresa un formato inválido de fecha de nacimiento 1ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario ingresa como fecha de nacimiento una fecha futura 1ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario no cumple con la cantidad de año necesarios 1ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario ingresa una fecha de nacimiento fuera del rango 0ms
 Test Files  4 passed (4)
      Tests  21 passed (21)
```

## Frontend (Vitest + Testing Library)

### Tests unitarios de componentes

Comando: `npm test -- --reporter=verbose`

```
 ✓ src/pages/pago/PagoPendiente.test.jsx > PagoPendiente esperando en otra pestaña > al volver el foco reconsulta y muestra el pago confirmado 212ms
 ✓ src/pages/pago/PagoPendiente.test.jsx > PagoPendiente esperando en otra pestaña > al confirmarse muestra el detalle de la reserva antes de ir a Mis reservas 73ms
 ✓ src/pages/pago/PagoPendiente.test.jsx > PagoPendiente esperando en otra pestaña > deja de consultar una vez resuelto el pago 40ms
 ✓ src/pages/pago/PagoPendiente.test.jsx > PagoPendiente esperando en otra pestaña > el estado pendiente no se muestra como error mientras se espera 30ms
 ✓ src/components/bookingForm/BookingForm.test.jsx > BookingForm > lista los horarios del día con su precio 803ms
 ✓ src/components/bookingForm/BookingForm.test.jsx > BookingForm > muestra el total antes de confirmar, sumando los servicios elegidos 734ms
 ✓ src/components/bookingForm/BookingForm.test.jsx > BookingForm > cuando el día elegido no tiene turnos, dice cuáles sí los tienen 469ms
 ✓ src/components/bookingForm/BookingForm.test.jsx > BookingForm > cuando la sede no tiene el deporte, sugiere las sedes que sí lo tienen 423ms
 ✓ src/components/bookingForm/BookingForm.test.jsx > BookingForm > arranca sin ningún deporte elegido 73ms
 ✓ src/components/bookingForm/BookingForm.test.jsx > BookingForm > marca en el desplegable las sedes sin canchas del deporte elegido 72ms
 Test Files  2 passed (2)
      Tests  10 passed (10)
```

### Test end-to-end (Cypress)

`cypress/e2e/accesoPorNiveles.cy.js` recorre la app real (front + back + base de test) y verifica el acceso a las pantallas según el nivel del usuario. Los pasos para correrlo están en el README del frontend.

> **Pendiente:** esta salida es del 13/10/2026, anterior a la incorporación del captcha en el login. Hay que volver a correr el test y reemplazarla cuando esa integración esté terminada.

Comando: `npm run cy:run` (con el backend en `npm run start:test` y el front en `npm run dev`)

```
  Running:  accesoPorNiveles.cy.js
  Acceso a las pantallas según el nivel de usuario
    √ Sin sesión, entrar a Mis reservas manda al login (2420ms)
    √ Con credenciales incorrectas muestra un error y no deja entrar (2690ms)
    √ Un cliente inicia sesión y vuelve a la pantalla que había pedido (1982ms)
    √ Un cliente no puede entrar al panel de administración (3142ms)
  4 passing (10s)
```
