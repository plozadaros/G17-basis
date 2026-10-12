import { crearInstantanea } from "./cache.js";

const respaldoCatalogo = crearInstantanea(() => localStorage, "techcart_respaldo");

export const guardarRespaldo = (productos) => respaldoCatalogo.guardar(productos);
export const leerRespaldo = () => respaldoCatalogo.leer();
export const olvidarRespaldo = () => respaldoCatalogo.olvidar();
