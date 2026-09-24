import { Service } from "./service.js";
import { Reserve } from "./reserve.js";
import { reserveService } from "./reserveService.js";
import { Court } from "./court.js";
import { Horary } from "./horary.js";
import { User } from "./user.js";
import { Location } from "./location.js";

Reserve.belongsToMany(Service, {
  through: reserveService,
  foreignKey: "idReserve",
  otherKey: "idService",
  as: "services"
});

Service.belongsToMany(Reserve, {
  through: reserveService,
  foreignKey: "idService",
  otherKey: "idReserve",
  as: "reserves"
});

Court.hasMany(Horary, {
  foreignKey: "idCourt",
  as: "horaries"
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
