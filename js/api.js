import { categorias } from "./datos.js";

const BASE = "https://dummyjson.com";
const ESPERA_MAXIMA = 8000;
const mapearProducto = (p) => ({
    id : p.id,
    nombre: p.title,
    marca : p.brand ?? "Sin marca",
    precio : p.price ?? 0,
    categoria  : p.category,
    stock : p.stock ?? 0,
    destacado : ( p.rating ?? 0) >= 4.9,
    imagen : p.thumbnail,
    alt  : p.title
});

const pedirCategoria = async  (categoria) => {
    const respuesta = await fetch(`${BASE}/products/category/${categoria}`,{
        headers : { Accept : "application/json"},
        signal : AbortSignal.timeout(ESPERA_MAXIMA)
    });
     // 400 y algo o 500 y algo.
    if(!respuesta.ok) { 
        throw new Error (`El servidor respondio ${respuesta.status} al pedir ${categoria}`);
    }

    const datos = await respuesta.json();

    if(!Array.isArray(datos.products)) {
        throw new Error (`La respuesta de ${categoria} no trae la lista de productos.`);
    }

    return datos.products.map(mapearProducto);
}

export const obtenerProductos = async () => {
    const listas = await Promise.all(categorias.map(pedirCategoria));
    // const listas = await Promise.allSettled(categorias.map(pedirCategoria));
    return listas.flat();
};