import Verification from "../models/verificationCode.js";
import crypto from "node:crypto";
import bcrypt  from "bcryptjs";
import { DateTime } from "luxon";
import { HttpError } from "../utils/httpError.js";

export const EXPIRATION_MINUTES = 10;

export const generateCode = async(idUser, proposito) => {
  await Verification.update(
    {usedCode: true},
    {
    where: {
      idUser: idUser,
      purposeCode: proposito,
      usedCode: false
    }
  });

  const codeGenerate = crypto.randomInt(0, 1000000);

  const codeString = codeGenerate.toString().padStart(6, '0');

  const codeHash = await bcrypt.hash(codeString, 10);

  const rightNow = DateTime.now()

  const expiry = rightNow.plus({minutes: EXPIRATION_MINUTES})

  const expiryForTime = expiry.toJSDate();

  await Verification.create({
    hashCode: codeHash,
    purposeCode: proposito,
    expiresAtCode: expiryForTime,
    idUser: idUser
  });

  return codeString;
};

export const MAX_ATTEMPTS = 5;

export const verifyCode = async(idUser, proposito, codeIn) => {
  const ultCode = await Verification.findOne({
    where: {
      idUser: idUser,
      purposeCode: proposito,
      usedCode: false
    },
    order: [['createdAt', 'DESC']]
  });

  if(!ultCode) {
   throw new HttpError(400, 'Código inválido o vencido.');
  };

  const now = DateTime.now();
  const expirationDate = DateTime.fromJSDate(ultCode.expiresAtCode);

  if(now > expirationDate){
    throw new HttpError(400, 'El código venció, pedí uno nuevo.');
  };

  if(ultCode.attemptsCode >= MAX_ATTEMPTS){
    throw new HttpError(403, 'Demasiados intentos, pedí un código nuevo.');
  };

  // bcrypt.compare tira error si recibe un número: el código puede llegar como 123456 en el JSON
  const validate = await bcrypt.compare(String(codeIn), ultCode.hashCode)

  if(!validate){
    ultCode.attemptsCode += 1;
    await ultCode.save();

    throw new HttpError(400, 'Código incorrecto, intente nuevamente.');
  };

  ultCode.usedCode = true;
  await ultCode.save();

  return true;
};

