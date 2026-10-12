import { categorias } from "./datos.js";
import { guardarRespaldo, leerRespaldo } from "./respaldo.js";

const BASE = "https://dummyjson.com";
const ESPERA_MAXIMA = 8000;

const mapearProducto = (p) => ({
    id : p.id,
    nombre: p.title,
    marca : p.brand ?? "Sin marca",
    precio : p.price ?? 0,
    categoria  : p.category,
    stock : p.stock ?? 0,
    destacado : (p.rating ?? 0) >= 4.9,
    imagen : p.thumbnail,
    alt  : p.title
});

const conTiempoLimite = (signal) =>
    signal ? AbortSignal.any([signal, AbortSignal.timeout(ESPERA_MAXIMA)]) : AbortSignal.timeout(ESPERA_MAXIMA);

const pedirJson = async (ruta, signal) => {
    const respuesta = await fetch(`${BASE}${ruta}`, {
        headers : {Accept : "application/json"},
        signal : conTiempoLimite(signal)
    });

    if (!respuesta.ok) {
        throw new Error(`El servidor respondio ${respuesta.status} al pedir ${ruta}`);
    }

    return respuesta.json();
};

const pedirCategoria = async (categoria) => {
    const datos = await pedirJson(`/products/category/${categoria}`);

    if (!Array.isArray(datos.products)) {
        throw new Error(`La respuesta de ${categoria} no trae la lista de productos.`);
    }

    return datos.products.map(mapearProducto);
};

export const obtenerProductos = async () => {
    try {
        const resultados = await Promise.allSettled(categorias.map(pedirCategoria));
        const llegaron = resultados.filter(({status}) => status === "fulfilled");

        if (llegaron.length === 0) {
            throw resultados[0].reason;
        }

        resultados
            .filter(({status}) => status === "rejected")
            .forEach(({reason}) => console.warn("Una categoria no respondio:", reason.message));

        const productos = llegaron.flatMap(({value}) => value);
        guardarRespaldo(productos);

        return {
            productos,
            fallaron : resultados.length - llegaron.length,
            origen : "api",
            fecha : null,
        };
    } catch (error) {
        const copia = leerRespaldo();
        if (!copia) throw error;

        return {
            productos : copia.productos,
            fallaron : 0,
            origen : "respaldo",
            fecha : copia.fecha,
        };
    }
};

export const obtenerProducto = async (id) => {
    const p = await pedirJson(`/products/${id}`);
    return {...mapearProducto(p), descripcion : p.description ?? ""};
};

export const buscarEnServidor = async (texto, signal) => {
    const datos = await pedirJson(`/products/search?q=${encodeURIComponent(texto)}&limit=24`, signal);
    return Array.isArray(datos.products) ? datos.products.map(mapearProducto) : [];
};
