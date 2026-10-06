// Manda un mail de prueba con el servicio real de mails, para comprobar que el SMTP del .env funciona.
// Con Ethereal el mail no llega a ninguna casilla: se ve en la URL que imprime el servicio.
// Uso: npm run verificar-mail -- [email]
import { enviarCodigo } from "../src/services/mail.service.js";

const [email = "prueba@canchaya.test"] = process.argv.slice(2);

try {
  await enviarCodigo(email, "004219", "REGISTRO", 10);
  console.log(`Mail de prueba enviado a ${email}.`);
  process.exit(0);
} catch (error) {
  console.error("No se pudo enviar el mail de prueba:", error.message);
  process.exit(1);
}
