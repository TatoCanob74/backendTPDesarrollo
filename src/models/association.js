import { Service } from './Servicio.js';
import { Reserve } from './Reserva.js';
import { reserveService } from './ReservaServicio.js';
import { Court } from './cancha.js';
import { Horary } from './Horario.js'

Service.belongsToMany(Reserve, {
  through: reserveService,
  foreignKey: "idService",
  otherKey: "idReserve"
});

Reserve.belongsToMany(Service, {
  through: reserveService,
  foreignKey: "idReserve",
  otherKey: "idService"
});

export {
  Service,
  Reserve,
  reserveService
};

Court.hasMany(Horary, { as: "horaries", foreignKey: "idCourt" });
Horary.belongsTo(Court, { foreignKey: "idCourt" });

export {
  Horary,
  Court
};