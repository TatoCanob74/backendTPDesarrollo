# Evidencia de ejecución de tests automáticos

Salida de los tests ejecutados el 13/10/2026 sobre la versión que se entrega.

## Backend (Vitest + supertest)

### Tests unitarios

Uno por integrante:

| Test | Autor | Qué prueba |
|:-|:-|:-|
| `tests/birthDate.test.js` | Francisco Gallon | Validación de la fecha de nacimiento en el registro |
| `tests/verifyToken.test.js` | Santiago Martínez | Middleware que protege las rutas con JWT |

Comando: `npx vitest run tests/birthDate.test.js tests/verifyToken.test.js --reporter=verbose`

```
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario no ingresa nada le dice que la fecha de nacimiento es obligatoria 9ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario ingresa un formato inválido de fecha de nacimiento 1ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario ingresa como fecha de nacimiento una fecha futura 2ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario no cumple con la cantidad de año necesarios 2ms
 ✓ tests/birthDate.test.js > validateBirthDate > Cuando el usuario ingresa una fecha de nacimiento fuera del rango 1ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el pedido no trae token responde 401 y no deja pasar 9ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el header no empieza con Bearer responde 401 6ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el token está firmado con otra clave responde 401 4ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el token está vencido responde 401 2ms
 ✓ tests/verifyToken.test.js > verifyToken > Cuando el token es válido guarda el usuario en req.user y deja pasar 3ms
 Test Files  2 passed (2)
      Tests  10 passed (10)
```

### Test de integración

`tests/app.test.js` levanta la app completa con supertest contra la base de test (`DB_NAME` terminado en `_test`).

Comando: `npm test`

Salida de la suite completa (unitarios + integración):

```
✓ tests/app.test.js > App > responde 404 en JSON para una ruta que no existe 35ms
 Test Files  3 passed (3)
      Tests  11 passed (11)
```

## Frontend (Vitest + Testing Library)

### Tests unitarios de componentes

Comando: `npm test -- --reporter=verbose`

```
 ✓ src/pages/pago/PagoPendiente.test.jsx > PagoPendiente esperando en otra pestaña > al volver el foco reconsulta y muestra el pago confirmado 459ms
 ✓ src/pages/pago/PagoPendiente.test.jsx > PagoPendiente esperando en otra pestaña > al confirmarse muestra el detalle de la reserva antes de ir a Mis reservas 135ms
 ✓ src/pages/pago/PagoPendiente.test.jsx > PagoPendiente esperando en otra pestaña > deja de consultar una vez resuelto el pago 31ms
 ✓ src/pages/pago/PagoPendiente.test.jsx > PagoPendiente esperando en otra pestaña > el estado pendiente no se muestra como error mientras se espera 24ms
 ✓ src/components/bookingForm/BookingForm.test.jsx > BookingForm > lista los horarios del día con su precio 1247ms
 ✓ src/components/bookingForm/BookingForm.test.jsx > BookingForm > muestra el total antes de confirmar, sumando los servicios elegidos 871ms
 ✓ src/components/bookingForm/BookingForm.test.jsx > BookingForm > cuando el día elegido no tiene turnos, dice cuáles sí los tienen 672ms
 ✓ src/components/bookingForm/BookingForm.test.jsx > BookingForm > cuando la sede no tiene el deporte, sugiere las sedes que sí lo tienen 453ms
 ✓ src/components/bookingForm/BookingForm.test.jsx > BookingForm > arranca sin ningún deporte elegido 144ms
 ✓ src/components/bookingForm/BookingForm.test.jsx > BookingForm > marca en el desplegable las sedes sin canchas del deporte elegido 110ms
 Test Files  2 passed (2)
      Tests  10 passed (10)
```

### Test end-to-end (Cypress)

`cypress/e2e/accesoPorNiveles.cy.js` recorre la app real (front + back + base de test) y verifica el acceso a las pantallas según el nivel del usuario. Los pasos para correrlo están en el README del frontend.

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
