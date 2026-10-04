import { ENVIO_GRATIS_DESDE } from "./tienda.js";

const TARIFAS = {
  Lima: 5.9,
  "Resto del Perú": 9.9,
  Internacional: 29.9,
};

export const tarifaPorZona = (zona) => TARIFAS[zona] ?? TARIFAS["Resto del Perú"];

export const costoDeEnvio = (total, zona = "Lima") =>
  total >= ENVIO_GRATIS_DESDE ? 0 : tarifaPorZona(zona);
