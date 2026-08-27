/**
 * Carga datos de prueba: localidades, canchas, horarios y servicios.
 *
 * Es idempotente: usa findOrCreate por el campo "natural" de cada entidad
 * (nomLocation, nameCourt, idCourt+day+startTime, nameService), así que
 * correrlo varias veces no duplica filas ya existentes.
 *
 * No toca Usuarios ni Reservas: ya hay cuentas y reservas reales cargadas
 * (con contraseñas hasheadas y fechas/pagos encadenados) y tocarlas a ciegas
 * podía romper algo. Si hace falta, se agrega en un script aparte.
 *
 * Uso: npm run cargar-datos
 */
import sequelize from "../src/config/database.js";
import { Location } from "../src/models/localidad.js";
import { Court } from "../src/models/cancha.js";
import { Horary } from "../src/models/Horario.js";
import { Service } from "../src/models/Servicio.js";

const LOCATIONS = [
  { nameCountry: "Argentina", nomLocation: "Mendoza" },
  { nameCountry: "Argentina", nomLocation: "Mar del Plata" },
  { nameCountry: "Argentina", nomLocation: "La Plata" }
];

const COURTS = [
  { nameCourt: "Set Point", typeCourt: "TENIS", hourlyPrice: 7000, stateCourt: "DISPONIBLE", capacityPlayers: 4, locationName: "Rosario" },
  { nameCourt: "La Bombonerita", typeCourt: "FUTBOL", hourlyPrice: 8000, stateCourt: "DISPONIBLE", capacityPlayers: 10, locationName: "Buenos Aires" },
  { nameCourt: "Punto Cordobes", typeCourt: "PADEL", hourlyPrice: 6500, stateCourt: "DISPONIBLE", capacityPlayers: 4, locationName: "Cordoba" },
  { nameCourt: "Estadio Sur", typeCourt: "FUTBOL", hourlyPrice: 7500, stateCourt: "OCUPADO", capacityPlayers: 10, locationName: "Cordoba" },
  { nameCourt: "Andes Tenis Club", typeCourt: "TENIS", hourlyPrice: 6800, stateCourt: "DISPONIBLE", capacityPlayers: 4, locationName: "Mendoza" },
  { nameCourt: "Playa Grande FC", typeCourt: "FUTBOL", hourlyPrice: 7200, stateCourt: "DISPONIBLE", capacityPlayers: 10, locationName: "Mar del Plata" },
  { nameCourt: "Bahia Padel", typeCourt: "PADEL", hourlyPrice: 6200, stateCourt: "DISPONIBLE", capacityPlayers: 4, locationName: "Mar del Plata" },
  { nameCourt: "Ciudad Tenis", typeCourt: "TENIS", hourlyPrice: 7100, stateCourt: "DISPONIBLE", capacityPlayers: 4, locationName: "La Plata" },
  { nameCourt: "Estudiantes 5", typeCourt: "FUTBOL", hourlyPrice: 8200, stateCourt: "DISPONIBLE", capacityPlayers: 10, locationName: "La Plata" }
]

// Horarios para las canchas nuevas (se resuelven por nameCourt más abajo).
const NEW_COURT_SLOTS = [
  { day: "Lunes", startTime: "09:00:00", endTime: "10:00:00" },
  { day: "Miércoles", startTime: "18:00:00", endTime: "19:00:00" },
  { day: "Viernes", startTime: "20:00:00", endTime: "21:00:00" },
  { day: "Sábado", startTime: "10:00:00", endTime: "11:30:00" }
]

// Horarios extra para las 2 canchas que ya existían (evitando pisar los que ya tienen).
const EXISTING_COURT_SLOTS = {
  "Campus Rosario": [
    { day: "Jueves", startTime: "19:00:00", endTime: "20:00:00" },
    { day: "Sábado", startTime: "09:00:00", endTime: "10:00:00" }
  ],
  "El Punto": [
    { day: "Miércoles", startTime: "17:00:00", endTime: "18:00:00" },
    { day: "Domingo", startTime: "11:00:00", endTime: "12:00:00" }
  ]
}

// priceService es decimal(5,2) en la base real (tope 999.99), aunque el
// modelo lo declare INTEGER, así que los precios se mantienen por debajo de eso.
const SERVICES = [
  { nameService: "Estacionamiento", priceService: 450, descriptionService: "Cochera cubierta dentro del predio." },
  { nameService: "Buffet", priceService: 600, descriptionService: "Bebidas y snacks en el buffet del club." },
  { nameService: "Alquiler de pelotas", priceService: 500, descriptionService: "Set de pelotas para el turno reservado." },
  { nameService: "Vestuarios premium", priceService: 800, descriptionService: "Vestuarios con lockers y agua caliente." },
  { nameService: "Iluminación nocturna", priceService: 700, descriptionService: "Reflectores para turnos después de las 20hs." }
]

function summarize(label, results) {
  const created = results.filter((r) => r[1]).length
  console.log(`${label}: ${created} creada(s), ${results.length - created} ya existían.`)
}

try {
  await sequelize.authenticate()
  await sequelize.sync()

  const locationResults = []
  for (const data of LOCATIONS) {
    locationResults.push(await Location.findOrCreate({ where: { nomLocation: data.nomLocation }, defaults: data }))
  }
  summarize("Localidades", locationResults)

  const allLocations = await Location.findAll()
  const locationIdByName = Object.fromEntries(allLocations.map((l) => [l.nomLocation, l.idLocation]))

  const courtResults = []
  for (const { locationName, ...data } of COURTS) {
    const idLocateCourt = locationIdByName[locationName]
    if (!idLocateCourt) {
      console.warn(`  Salteando "${data.nameCourt}": no encontré la localidad "${locationName}".`)
      continue
    }
    courtResults.push(
      await Court.findOrCreate({ where: { nameCourt: data.nameCourt }, defaults: { ...data, idLocateCourt } })
    )
  }
  summarize("Canchas", courtResults)

  const allCourts = await Court.findAll()
  const courtIdByName = Object.fromEntries(allCourts.map((c) => [c.nameCourt, c.idCourt]))

  const horaryResults = []
  for (const { locationName: _locationName, nameCourt } of COURTS) {
    const idCourt = courtIdByName[nameCourt]
    if (!idCourt) continue
    for (const slot of NEW_COURT_SLOTS) {
      horaryResults.push(
        await Horary.findOrCreate({
          where: { idCourt, day: slot.day, startTime: slot.startTime },
          defaults: { idCourt, ...slot }
        })
      )
    }
  }
  for (const [nameCourt, slots] of Object.entries(EXISTING_COURT_SLOTS)) {
    const idCourt = courtIdByName[nameCourt]
    if (!idCourt) continue
    for (const slot of slots) {
      horaryResults.push(
        await Horary.findOrCreate({
          where: { idCourt, day: slot.day, startTime: slot.startTime },
          defaults: { idCourt, ...slot }
        })
      )
    }
  }
  summarize("Horarios", horaryResults)

  const serviceResults = []
  for (const data of SERVICES) {
    serviceResults.push(await Service.findOrCreate({ where: { nameService: data.nameService }, defaults: data }))
  }
  summarize("Servicios", serviceResults)

  console.log("\nListo. No se tocaron Usuarios ni Reservas.")
  process.exit(0)
} catch (error) {
  console.error("No se pudieron cargar los datos:", error.message)
  process.exit(1)
}
