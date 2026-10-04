const productos = [
  { id: 1, nombre: "MacBook Pro 14", precio: 1999.99, categoria: "laptops", stock: 5, destacado: true },
  { id: 2, nombre: "iPhone 13 Pro", precio: 1099.99, categoria: "smartphones", stock: 8, destacado: false },
  { id: 3, nombre: "iPad Mini 2021", precio: 499.99, categoria: "tablets", stock: 0, destacado: false },
  { id: 4, nombre: "AirPods Max", precio: 549.99, categoria: "audio", stock: 3, destacado: false },
];

productos.push({ id: 5, nombre: "MacBook Air 13", precio: 1299.99, categoria: "laptops", stock: 4, destacado: false });
productos.push({ id: 6, nombre: "Magic Keyboard", precio: 99.99, categoria: "accesorios", stock: 12, destacado: false });

productos.push({ id: 7, nombre: "Apple Watch Series 9", precio: 429.99, categoria: "wearables", stock: 6, destacado: false });

const MONEDA = "$";
const IGV = 0.18;
const ENVIO_GRATIS_DESDE = 50;

const formatearPrecio = (valor) =>
  MONEDA + valor.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const precioConIgv = (precio) => precio * (1 + IGV);

console.log("Productos en el catálogo:", productos.length);
console.table(productos);

const valorDelCatalogo = productos.reduce((suma, p) => suma + p.precio * p.stock, 0);
console.log("Valor del catálogo:", formatearPrecio(valorDelCatalogo));
console.log("MacBook Pro 14 con IGV:", formatearPrecio(precioConIgv(productos[0].precio)));

const nombres = productos.map((p) => p.nombre);
console.log("Nombres:", nombres);

const catalogoPresentable = productos.map(
  (p) => p.nombre + " · " + p.categoria + " · " + formatearPrecio(p.precio)
);
console.log("Catálogo presentable:");
catalogoPresentable.forEach((linea) => console.log("  " + linea));

const presentableEnStock = productos
  .filter((p) => p.stock > 0)
  .map((p) => p.nombre + " · " + p.categoria + " · " + formatearPrecio(p.precio));
console.log("Solo los que tienen stock:");
presentableEnStock.forEach((linea) => console.log("  " + linea));

const enStock = productos.filter((p) => p.stock > 0);
console.log("Con stock:", enStock.length, "de", productos.length);

const baratos = productos.filter((p) => p.precio < 600).map((p) => p.nombre);
console.log("Debajo de 600:", baratos);

const sumaDePrecios = productos.reduce((suma, p) => suma + p.precio, 0);
console.log("Suma de precios:", formatearPrecio(sumaDePrecios));

const primeroCaro = productos.find((p) => p.precio > 1500);
console.log("Primero sobre 1500:", primeroCaro.nombre);
console.log("¿Hay algo agotado?", productos.some((p) => p.stock === 0));
console.log("¿Todos cuestan menos de 3000?", productos.every((p) => p.precio < 3000));
console.log("¿Vendemos tablets?", productos.map((p) => p.categoria).includes("tablets"));

const porPrecio = productos.slice().sort((a, b) => a.precio - b.precio);
console.log(
  "Del más barato al más caro:",
  porPrecio.map((p) => p.nombre)
);

const cuantosHayDe = (categoria) => productos.filter((p) => p.categoria === categoria).length;

console.log('cuantosHayDe("laptops"):', cuantosHayDe("laptops"));
console.log('cuantosHayDe("televisores"):', cuantosHayDe("televisores"));

const resumenCarrito = (items) => {
  const cantidad = items.reduce((suma, item) => suma + item.cantidad, 0);
  const total = items.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
  const envio = total >= ENVIO_GRATIS_DESDE ? 0 : 9.9;
  return { cantidad, total, envio };
};

const carritoChico = [{ nombre: "Cable USB-C", precio: 20, cantidad: 1 }];
const carritoGrande = [
  { nombre: "MacBook Pro 14", precio: 1999.99, cantidad: 1 },
  { nombre: "AirPods Max", precio: 549.99, cantidad: 2 },
];

console.log("Carrito de $20:", resumenCarrito(carritoChico));
console.log("Carrito grande:", resumenCarrito(carritoGrande));

const masBaratoConSort = productos
  .filter((p) => p.stock > 0)
  .slice()
  .sort((a, b) => a.precio - b.precio)[0];

const masBaratoConReduce = productos
  .filter((p) => p.stock > 0)
  .reduce((barato, p) => (p.precio < barato.precio ? p : barato));

console.log("Más barato con stock (filter + sort):", masBaratoConSort.nombre, formatearPrecio(masBaratoConSort.precio));
console.log("Más barato con stock (filter + reduce):", masBaratoConReduce.nombre, formatearPrecio(masBaratoConReduce.precio));
console.log("¿Dan el mismo producto?", masBaratoConSort === masBaratoConReduce);
