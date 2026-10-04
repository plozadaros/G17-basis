export const MONEDA = "$";

const formatearPrecio = (valor) =>
  `${MONEDA}${valor.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default formatearPrecio;
