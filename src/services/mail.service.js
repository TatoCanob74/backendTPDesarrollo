import nodemailer from "nodemailer";

// Se crea una sola vez, al cargar el módulo, y se reutiliza en cada envío.
// No se exporta: el resto de la app solo conoce enviarCodigo.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  // 587 usa STARTTLS: la conexión arranca sin cifrar y se cifra antes de autenticar.
  // secure: true es solo para el puerto 465 (TLS desde el primer byte).
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Asunto e introducción de cada propósito. Las claves coinciden con el ENUM del modelo de códigos.
const PLANTILLAS = {
  REGISTRO: {
    asunto: "Verificá tu cuenta de CanchaYa",
    intro: "Para terminar de crear tu cuenta, ingresá este código:"
  },
  RECUPERACION: {
    asunto: "Recuperá tu contraseña de CanchaYa",
    intro: "Para elegir una contraseña nueva, ingresá este código:"
  }
};

// No atrapa errores a propósito: si el envío falla, el error sube y decide quien la llamó.
export const codeSend = async (email, codigo, proposito, minutosVencimiento) => {
  const plantilla = PLANTILLAS[proposito];
  if (!plantilla) {
    throw new Error(`Propósito de mail desconocido: ${proposito}`);
  }

  const aviso = `El código vence en ${minutosVencimiento} minutos. Si no lo pediste, ignorá este mail.`;

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: plantilla.asunto,
    text: `${plantilla.intro}\n\n${codigo}\n\n${aviso}`,
    html: `<p>${plantilla.intro}</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px">${codigo}</p>
<p>${aviso}</p>`
  });

  // Con Ethereal devuelve la URL para ver el mail; con un SMTP real devuelve false y no imprime nada.
  const vistaPrevia = nodemailer.getTestMessageUrl(info);
  if (vistaPrevia) {
    console.log(`Mail de ${proposito} para ${email}: ${vistaPrevia}`);
  }

  return info;
};

export default codeSend;
