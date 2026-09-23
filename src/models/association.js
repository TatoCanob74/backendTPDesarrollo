import { Service } from "./Servicio.js";
import { Reserve } from "./Reserva.js";
import { reserveService } from "./ReservaServicio.js";
import { Court } from "./cancha.js";
import { Horary } from "./Horario.js";
import { User } from "./usuarios.js";
import { Location } from "./localidad.js";

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

Court.hasMany(Horary, {
  foreignKey: "idCourt",
  as: "Horarios"
});

Horary.belongsTo(Court, {
  foreignKey: "idCourt"
});

Court.belongsTo(Location, {
  foreignKey: "idLocateCourt"
});

Location.hasMany(Court, {
  foreignKey: "idLocateCourt"
});

Court.hasMany(Reserve, {
  foreignKey: "idCourt"
});

Reserve.belongsTo(Court, {
  foreignKey: "idCourt"
});

Horary.hasMany(Reserve, {
  foreignKey: "idHorary"
});

Reserve.belongsTo(Horary, {
  foreignKey: "idHorary"
});

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
