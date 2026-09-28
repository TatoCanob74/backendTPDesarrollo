// Carga datos de prueba (idempotente). Uso: npm run cargar-datos
import sequelize, { dbReady } from "../src/config/database.js";
import "../src/models/association.js";
import { Location } from "../src/models/location.js";
import { Complex } from "../src/models/complex.js";
import { Court } from "../src/models/court.js";
import { Horary } from "../src/models/horary.js";
import { Service } from "../src/models/service.js";

const LOCATIONS = [
  { nameCountry: "Argentina", nomLocation: "Rosario" },
  { nameCountry: "Argentina", nomLocation: "Buenos Aires" },
  { nameCountry: "Argentina", nomLocation: "Cordoba" },
  { nameCountry: "Argentina", nomLocation: "Mendoza" },
  { nameCountry: "Argentina", nomLocation: "Mar del Plata" },
  { nameCountry: "Argentina", nomLocation: "La Plata" }
];

// Los complejos se cargan sin administrador: lo asigna el superadmin desde la app
const COMPLEXES = [
  { nameComplex: "Rosario Sport Center", addressComplex: "Bv. Oroño 1500", locationName: "Rosario" },
  { nameComplex: "Palermo Fútbol", addressComplex: "Av. Santa Fe 4200", locationName: "Buenos Aires" },
  { nameComplex: "Córdoba Racket Club", addressComplex: "Av. Colón 2100", locationName: "Cordoba" },
  { nameComplex: "Andes Club", addressComplex: "Av. San Martín 800", locationName: "Mendoza" },
  { nameComplex: "Complejo Playa Grande", addressComplex: "Av. Patricio Peralta Ramos 3000", locationName: "Mar del Plata" },
  { nameComplex: "La Plata Deportes", addressComplex: "Calle 7 N° 1200", locationName: "La Plata" }
]

const COURTS = [
  { nameCourt: "Set Point", typeCourt: "TENIS", hourlyPrice: 7000, stateCourt: "DISPONIBLE", capacityPlayers: 4, complexName: "Rosario Sport Center" },
  { nameCourt: "La Bombonerita", typeCourt: "FUTBOL", hourlyPrice: 8000, stateCourt: "DISPONIBLE", capacityPlayers: 10, complexName: "Palermo Fútbol" },
  { nameCourt: "Punto Cordobes", typeCourt: "PADEL", hourlyPrice: 6500, stateCourt: "DISPONIBLE", capacityPlayers: 4, complexName: "Córdoba Racket Club" },
  { nameCourt: "Estadio Sur", typeCourt: "FUTBOL", hourlyPrice: 7500, stateCourt: "OCUPADO", capacityPlayers: 10, complexName: "Córdoba Racket Club" },
  { nameCourt: "Andes Tenis Club", typeCourt: "TENIS", hourlyPrice: 6800, stateCourt: "DISPONIBLE", capacityPlayers: 4, complexName: "Andes Club" },
  { nameCourt: "Playa Grande FC", typeCourt: "FUTBOL", hourlyPrice: 7200, stateCourt: "DISPONIBLE", capacityPlayers: 10, complexName: "Complejo Playa Grande" },
  { nameCourt: "Bahia Padel", typeCourt: "PADEL", hourlyPrice: 6200, stateCourt: "DISPONIBLE", capacityPlayers: 4, complexName: "Complejo Playa Grande" },
  { nameCourt: "Ciudad Tenis", typeCourt: "TENIS", hourlyPrice: 7100, stateCourt: "DISPONIBLE", capacityPlayers: 4, complexName: "La Plata Deportes" },
  { nameCourt: "Estudiantes 5", typeCourt: "FUTBOL", hourlyPrice: 8200, stateCourt: "DISPONIBLE", capacityPlayers: 10, complexName: "La Plata Deportes" }
]

const NEW_COURT_SLOTS = [
  { day: "Lunes", startTime: "09:00:00", endTime: "10:00:00" },
  { day: "Miércoles", startTime: "18:00:00", endTime: "19:00:00" },
  { day: "Viernes", startTime: "20:00:00", endTime: "21:00:00" },
  { day: "Sábado", startTime: "10:00:00", endTime: "11:30:00" }
]

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

// priceService es decimal(5,2) en la base real (tope 999.99), aunque el modelo lo declare INTEGER
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
  await dbReady

  const locationResults = []
  for (const data of LOCATIONS) {
    locationResults.push(await Location.findOrCreate({ where: { nomLocation: data.nomLocation }, defaults: data }))
  }
  summarize("Localidades", locationResults)

  const allLocations = await Location.findAll()
  const locationIdByName = Object.fromEntries(allLocations.map((l) => [l.nomLocation, l.idLocation]))

  const complexResults = []
  for (const { locationName, ...data } of COMPLEXES) {
    const idLocation = locationIdByName[locationName]
    if (!idLocation) {
      console.warn(`  Salteando "${data.nameComplex}": no encontré la localidad "${locationName}".`)
      continue
    }
    complexResults.push(
      await Complex.findOrCreate({ where: { nameComplex: data.nameComplex, idLocation }, defaults: { ...data, idLocation } })
    )
  }
  summarize("Complejos", complexResults)

  const allComplexes = await Complex.findAll()
  const complexIdByName = Object.fromEntries(allComplexes.map((c) => [c.nameComplex, c.idComplex]))

  const courtResults = []
  for (const { complexName, ...data } of COURTS) {
    const idComplex = complexIdByName[complexName]
    if (!idComplex) {
      console.warn(`  Salteando "${data.nameCourt}": no encontré el complejo "${complexName}".`)
      continue
    }
    courtResults.push(
      await Court.findOrCreate({ where: { nameCourt: data.nameCourt }, defaults: { ...data, idComplex } })
    )
  }
  summarize("Canchas", courtResults)

  const allCourts = await Court.findAll()
  const courtIdByName = Object.fromEntries(allCourts.map((c) => [c.nameCourt, c.idCourt]))

  const horaryResults = []
  for (const { nameCourt } of COURTS) {
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
