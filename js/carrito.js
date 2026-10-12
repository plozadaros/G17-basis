import { IGV, ENVIO_GRATIS_DESDE, costoDeEnvio } from "./tienda.js";

export const CLAVE_CARRITO = "techcart_carrito";

export const topeDe = ({stock}) => (typeof stock === "number" && stock > 0 ? stock : Infinity);

export const enElTope = (linea) => linea.cantidad >= topeDe(linea);

export const sumarLinea = (lineas, producto, cuantas = 1) => {
    const existente = lineas.find(({id}) => id === producto.id);

    if (!existente) {
        return [...lineas, {...producto, cantidad: Math.min(cuantas, topeDe(producto))}];
    }

    return lineas.map((linea) =>
        linea.id === producto.id
            ? {...linea, cantidad: Math.min(linea.cantidad + cuantas, topeDe(linea))}
            : linea);
};

export const agregarAlCarrito = (carrito, producto, cuantas = 1) => sumarLinea(carrito, producto, cuantas);

export const cambiarCantidad = (lineas, id, paso) =>
    lineas
        .map((linea) => (linea.id === id
            ? {...linea, cantidad: Math.min(linea.cantidad + paso, topeDe(linea))}
            : linea))
        .filter(({cantidad}) => cantidad > 0);

export const quitarDelCarrito = (carrito, id) => carrito.filter((linea) => linea.id !== id);

export const resumenCarrito = (carrito) => {
    const unidades = carrito.reduce((suma, {cantidad}) => suma + cantidad, 0);
    const subTotal = carrito.reduce((suma, {precio, cantidad}) => suma + precio * cantidad, 0);
    const igv = subTotal * IGV;
    const envio = unidades === 0 ? 0 : costoDeEnvio(subTotal);
    return {unidades, subTotal, igv, envio, total : subTotal + igv + envio};
};

export const faltaParaEnvioGratis = (subTotal) => Math.max(ENVIO_GRATIS_DESDE - subTotal, 0);

const agruparLineas = (guardado) =>
    guardado.reduce((lineas, linea) => sumarLinea(lineas, linea, Number(linea.cantidad) || 1), []);

export const guardarCarrito = (carrito) => {
    try {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    } catch (error) {
        console.warn("No se pudo guardar el carrito:", error.message);
    }
};

export const leerCarrito = () => {
    try {
        const crudo = localStorage.getItem(CLAVE_CARRITO);
        const guardado = crudo ? JSON.parse(crudo) : [];
        return Array.isArray(guardado) ? agruparLineas(guardado) : [];
    } catch (error) {
        console.warn("El carrito guardado no se pudo leer, empiece desde uno vacio:", error.message);
        return [];
    }
};

export const olvidarCarrito = () => {
    try {
        localStorage.removeItem(CLAVE_CARRITO);
    } catch (error) {
        console.warn("No se pudo borrar el carrito guardado:", error.message);
    }
};
