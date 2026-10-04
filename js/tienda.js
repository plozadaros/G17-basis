export const IGV = 0.18;
export const ENVIO_GRATIS_DESDE = 50;

const REDONDEO = 2;

const redondear = (valor) => Number(valor.toFixed(REDONDEO));

export const precioConIgv = (precio) => redondear(precio * (1 + IGV));

export const conStock = (items) => items.filter(({ stock }) => stock > 0);

export const buscar = (items, texto) =>
  items.filter(({ nombre }) => nombre.toLowerCase().includes(texto.toLowerCase()));

export const valorDelCatalogo = (items) =>
  redondear(items.reduce((suma, { precio, stock }) => suma + precio * stock, 0));

export const resumenCarrito = (items, costoDeEnvio, zona = "Lima") => {
  const unidades = items.reduce((suma, { cantidad }) => suma + cantidad, 0);
  const total = redondear(items.reduce((suma, { precio, cantidad }) => suma + precio * cantidad, 0));
  const envio = costoDeEnvio(total, zona);
  return { unidades, total, envio, zona };
};

export const cuantosHayDe = (items, categoria) =>
  items.filter((producto) => producto.categoria === categoria).length;

export const masBaratoConStock = (items) =>
  conStock(items).reduce((barato, producto) => (producto.precio < barato.precio ? producto : barato));

export const agruparPorCategoria = (items) =>
  items.reduce(
    (grupos, producto) => ({
      ...grupos,
      [producto.categoria]: [...(grupos[producto.categoria] ?? []), producto],
    }),
    {}
  );

export const aplicarDescuentoA = (items, categoria, porcentaje = 10) =>
  items.map((producto) =>
    producto.categoria === categoria
      ? { ...producto, precio: redondear(producto.precio * (1 - porcentaje / 100)) }
      : producto
  );
