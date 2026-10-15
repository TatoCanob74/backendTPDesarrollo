# Propuesta TP DSW

## Grupo
### Integrantes
* 55103 - Gallon, Francisco
* 53749 - Martínez, Santiago

### Repositorios
* [frontend app](https://github.com/TatoCanob74/frontendTPDWS)
* [backend app](https://github.com/TatoCanob74/backendTPDesarrollo)

## Tema
### Descripción
CanchaYa es una plataforma para reservar canchas de fútbol, tenis y pádel en distintos complejos deportivos. El cliente elige deporte, sede, complejo, día y horario, suma servicios opcionales (por ejemplo alquiler de pelota o pecheras) y paga la reserva con Mercado Pago. Cada complejo tiene un administrador que gestiona sus canchas, horarios y reservas, y un superadministrador gestiona la plataforma completa.

### Modelo

```mermaid
erDiagram
    LOCALIDAD ||--o{ COMPLEJO : "tiene"
    USUARIO |o--o| COMPLEJO : "administra"
    COMPLEJO ||--o{ CANCHA : "tiene"
    CANCHA ||--o{ HORARIO : "tiene"
    USUARIO ||--o{ RESERVA : "hace"
    CANCHA ||--o{ RESERVA : "se reserva en"
    HORARIO ||--o{ RESERVA : "ocupa"
    RESERVA }o--o{ SERVICIO : "incluye"
    USUARIO ||--o{ CODIGO_VERIFICACION : "recibe"

    LOCALIDAD {
        int idLocation PK
        string nameCountry
        string nomLocation
    }
    COMPLEJO {
        int idComplex PK
        string nameComplex
        string addressComplex
        int idLocation FK
        int idAdmin FK
    }
    CANCHA {
        int idCourt PK
        enum typeCourt "FUTBOL | TENIS | PADEL"
        string nameCourt
        int hourlyPrice
        enum stateCourt "DISPONIBLE | OCUPADO"
        int capacityPlayers
        int idComplex FK
    }
    HORARIO {
        int idHorary PK
        enum day
        time startTime
        time endTime
        int idCourt FK
    }
    SERVICIO {
        int idService PK
        string nameService
        int priceService
        string descriptionService
    }
    USUARIO {
        int idUser PK
        string nameUser
        string surnameUser
        string emailUser
        string dateUser
        string aliasUser
        enum typeUser "SUPERADMIN | ADMIN | CLIENTE"
        enum stateUser "ACTIVO | INACTIVO"
        bool verifiedUser
    }
    RESERVA {
        int idReserve PK
        date dateReserve
        int totalAmount
        enum stateReserva "pendiente | confirmada | cancelada"
        string paymentId
        string paymentStatus
        int idUser FK
        int idCourt FK
        int idHorary FK
    }
    CODIGO_VERIFICACION {
        int idCode PK
        string hashCode
        enum purposeCode "REGISTRO | RECUPERACION"
        datetime expiresAtCode
        bool usedCode
        int attemptsCode
        int idUser FK
    }
```

## Alcance Funcional

### Alcance Mínimo

Grupo de 2 integrantes.

Regularidad:
|Req|Detalle|
|:-|:-|
|CRUD simple|1. CRUD Localidad<br>2. CRUD Servicio|
|CRUD dependiente|1. CRUD Complejo {depende de} CRUD Localidad|
|Listado<br>+<br>detalle|1. Listado de reservas (panel de administración) filtrado por estado y fecha, muestra número, fecha, cancha, horario, monto y estado => detalle muestra cliente, complejo, sede, servicios contratados, total y estado del pago|
|CUU/Epic|1. Reservar una cancha|

Adicionales para Aprobación
|Req|Detalle|
|:-|:-|
|CRUD|1. CRUD Localidad<br>2. CRUD Servicio<br>3. CRUD Complejo<br>4. CRUD Cancha<br>5. CRUD Horario<br>6. CRUD Usuario (registro, perfil, alta de administradores, baja y activación por el superadmin)<br>7. CRUD Reserva|
|CUU/Epic|1. Reservar una cancha<br>2. Pagar una reserva con Mercado Pago (usa la reserva creada en el CUU 1 y la confirma al aprobarse el pago)|

### Alcance Adicional Voluntario

|Req|Detalle|
|:-|:-|
|Listados|1. Horarios filtrados por cancha, día y turno (mañana, tarde, noche)<br>2. Mis reservas del cliente, con detalle de cada una|
|CUU/Epic|1. Cancelar una reserva (hasta 6 horas antes)<br>2. Verificar el email al registrarse con un código de 6 dígitos<br>3. Recuperar la contraseña con un código por email|
|Otros|1. Integración con Mercado Pago (Checkout Pro, webhook y sincronización del estado de pago)<br>2. Tres niveles de acceso: cliente, administrador de complejo y superadministrador<br>3. Envío de mails con nodemailer (SMTP)|
