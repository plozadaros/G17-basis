export const IGV = 0.18;
export const ENVIO_GRATIS_DESDE = 5000;

export const precioConIgv = (precio) => precio * (1 + IGV);

export function tarifaPorZona(zona) {
    switch(zona) {
        case "Lima" : 
            return 0;
        case "Resto del Peru":
            return 9.99;
        case "Internacional":
            return 29.9
        default : 
            return 9.99;
    }
}

export const buscar = (items, texto) => items.filter(({nombre}) => nombre.toLowerCase().includes(texto.toLowerCase()));
export const masCaro = (items) => items.reduce((mayor, p) => (p.precio > mayor.precio ? p : mayor), items[0]);
export const agregarProducto = (items, nuevoProducto) => [...items, nuevoProducto];
export const sumar = (...precios) => precios.reduce((suma, n) => suma + n, 0);
export const actualizarPrecio = (producto, precio) => ({...producto, precio});

export const conDescuento = (precio, porcentaje = 10) => precio - precio * (porcentaje / 100);
export const costoDeEnvio = (total, zona = "Resto del Peru") => total >= ENVIO_GRATIS_DESDE ? 0 : tarifaPorZona(zona);

export const resumenTienda = (items) => {
    const disponibles = items.filter(({stock}) => stock > 0);
    const agotados = items.length - disponibles.length;
    const valorCatalogo = sumar(...items.map(({precio}) => precio));
    const valorInventario = items.reduce((suma, {precio, stock}) => suma + precio * stock, 0);
    const { nombre : masCaroDe } = masCaro(items);
    return {
        productos : items.length,
        disponibles : disponibles.length, 
        agotados,
        valorCatalogo,
        valorInventario,
        masCaroDe,
    };
};