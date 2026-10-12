export const MONEDA = "$";
const formatearPrecio = (precio) => `${MONEDA}${precio.toFixed(2)}`;

export default formatearPrecio;