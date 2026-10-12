export const MONEDA = "$";

const formatearPrecio = (precio) => `${MONEDA}${precio.toFixed(2)}`;

export const formatearFecha = (iso) =>
    new Date(iso).toLocaleString("es-PE", {dateStyle: "long", timeStyle: "short"});

export default formatearPrecio;
