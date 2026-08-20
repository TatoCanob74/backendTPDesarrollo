import { Service } from "./Servicio.js";
import { Reserve } from "./Reserva.js";
import { reserveService } from "./ReservaServicio.js";
import { Court } from "./cancha.js";
import { Horary } from "./Horario.js";
import { User } from "./usuarios.js";
import { Location } from "./localidad.js";

// =====================
// RESERVA <-> SERVICIO (Muchos a Muchos)
// =====================

Reserve.belongsToMany(Service, {
  through: reserveService,
  foreignKey: "idReserve",
  otherKey: "idService",
  as: "Servicios"
});

Service.belongsToMany(Reserve, {
  through: reserveService,
  foreignKey: "idService",
  otherKey: "idReserve",
  as: "Reservas"
});

// =====================
// CANCHA <-> HORARIO (Uno a Muchos)
// =====================

Court.hasMany(Horary, {
  foreignKey: "idCourt",
  as: "Horarios"
});

Horary.belongsTo(Court, {
  foreignKey: "idCourt"
});

// =====================
// CANCHA <-> LOCALIDAD (Uno a Muchos)
// =====================
// Sin esta asociación no se puede hacer include de la sede, y el listado de
// canchas no tiene forma de mostrar a qué localidad pertenece cada una.

Court.belongsTo(Location, {
  foreignKey: "idLocateCourt"
});

Location.hasMany(Court, {
  foreignKey: "idLocateCourt"
});

// =====================
// CANCHA <-> RESERVA (Uno a Muchos)
// =====================

Court.hasMany(Reserve, {
  foreignKey: "idCourt"
});

Reserve.belongsTo(Court, {
  foreignKey: "idCourt"
});

// =====================
// HORARIO <-> RESERVA (Uno a Muchos)
// =====================

Horary.hasMany(Reserve, {
  foreignKey: "idHorary"
});

Reserve.belongsTo(Horary, {
  foreignKey: "idHorary"
});

// =====================
// USUARIO <-> RESERVA (Uno a Muchos)
// =====================

User.hasMany(Reserve, {
  foreignKey: "idUser"
});

Reserve.belongsTo(User, {
  foreignKey: "idUser"
});

export {
  Service,
  Reserve,
  reserveService,
  Court,
  Horary,
  User,
  Location
};
