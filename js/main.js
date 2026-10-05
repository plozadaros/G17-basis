import { productos, agregarProducto } from "./datos.js";
import formatearPrecio, { MONEDA } from "./formato.js";
import {
  IGV,
  ENVIO_GRATIS_DESDE,
  precioConIgv,
  conStock,
  buscar,
  cuantosHayDe,
  masBaratoConStock,
  valorDelCatalogo,
  resumenCarrito,
  agruparPorCategoria,
  aplicarDescuentoA,
} from "./tienda.js";
import { tarifaPorZona, costoDeEnvio } from "./envio.js";

const appleWatch = {
  id: 7,
  nombre: "Apple Watch Series 4",
  precio: 429.99,
  categoria: "wearables",
  stock: 6,
  destacado: false,
  envio: { zona: "Lima", dias: 2 },
};

const catalogo = agregarProducto(productos, appleWatch);

console.log("Catálogo original:", productos.length);
console.log("Catálogo con el producto nuevo:", catalogo.length);
console.log("Con stock:", conStock(catalogo).length);
console.log("¿El original quedó intacto?", productos.length === 6);

const { nombre, categoria, precio, stock } = appleWatch;

const ficha = `
  Producto : ${nombre}
  Categoría: ${categoria}
  Precio   : ${formatearPrecio(precio)}
  Con IGV  : ${formatearPrecio(precioConIgv(precio))}
  Stock    : ${stock} unidades
`;

console.log(ficha);

console.log("Moneda:", MONEDA, "· IGV:", `${IGV * 100}%`, "· Envío gratis desde:", formatearPrecio(ENVIO_GRATIS_DESDE));
console.log("Valor del catálogo:", formatearPrecio(valorDelCatalogo(catalogo)));
console.log('buscar("mac"):', buscar(catalogo, "mac").map(({ nombre }) => nombre));

console.log('cuantosHayDe("laptops"):', cuantosHayDe(catalogo, "laptops"));
console.log('cuantosHayDe("televisores"):', cuantosHayDe(catalogo, "televisores"));

const barato = masBaratoConStock(catalogo);
console.log("El más barato con stock:", barato.nombre, formatearPrecio(barato.precio));

console.log("Tarifa a Lima:", formatearPrecio(tarifaPorZona("Lima")));
console.log("Tarifa a una zona desconocida:", formatearPrecio(tarifaPorZona("Marte")));
console.log("Envío de un carrito de $20 a Internacional:", formatearPrecio(costoDeEnvio(20, "Internacional")));
console.log("Envío de un carrito de $120 a Internacional:", formatearPrecio(costoDeEnvio(120, "Internacional")));

const carrito = [
  { nombre: "Apple MagSafe Battery Pack", precio: 99.99, cantidad: 1 },
  { nombre: "AirPods Max", precio: 549.99, cantidad: 2 },
];

console.log("Resumen del carrito:", resumenCarrito(carrito, costoDeEnvio, "Resto del Perú"));
console.log("Resumen de un carrito chico:", resumenCarrito([{ nombre: "Cable USB-C", precio: 20, cantidad: 1 }], costoDeEnvio, "Lima"));

const fichaCorta = ({ nombre, precio, envio: { zona, dias } }) => `
  ${nombre} — ${formatearPrecio(precio)}
  Llega a ${zona} en ${dias} ${dias === 1 ? "día" : "días"}
`;

console.log("Fichas cortas:");
catalogo.map(fichaCorta).forEach((texto) => console.log(texto));

console.log("Agrupado por categoría:", agruparPorCategoria(catalogo));

const conDescuento = aplicarDescuentoA(catalogo, "laptops", 15);

console.log("Laptops antes:", catalogo.filter(({ categoria }) => categoria === "laptops").map(({ nombre, precio }) => `${nombre} ${formatearPrecio(precio)}`));
console.log("Laptops después:", conDescuento.filter(({ categoria }) => categoria === "laptops").map(({ nombre, precio }) => `${nombre} ${formatearPrecio(precio)}`));
console.log("¿El accesorio quedó igual?", catalogo[5] === conDescuento[5]);
console.log("¿La laptop fue reemplazada?", catalogo[0] === conDescuento[0]);
console.log("Sin porcentaje, el valor por defecto:", aplicarDescuentoA(catalogo, "audio")[3].precio);

const [primero, segundo, ...demas] = catalogo;
console.log("Desestructurando el arreglo:", primero.nombre, "·", segundo.nombre, "· y", demas.length, "más");

const precios = catalogo.map(({ precio }) => precio);
console.log("El más caro con spread:", formatearPrecio(Math.max(...precios)));

const sumar = (...valores) => valores.reduce((suma, valor) => suma + valor, 0);
console.log("Rest juntando argumentos sueltos:", formatearPrecio(sumar(...precios)));

const original = catalogo[2];
const copiaSuperficial = { ...original, nombre: "iPad Mini (copia)" };
const copiaProfunda = { ...original, nombre: "iPad Mini (copia buena)", envio: { ...original.envio } };
copiaSuperficial.envio.dias = 99;
console.log("La copia superficial comparte el envío:", original.envio.dias === 99);
console.log("La copia profunda no lo comparte:", copiaProfunda.envio.dias);
original.envio.dias = 4;

const cupon = null;
console.log("Descuento del cupón:", cupon?.porcentaje ?? 0);
