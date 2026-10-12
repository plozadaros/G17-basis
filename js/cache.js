export const crearInstantanea = (almacen, clave) => ({
    guardar(productos) {
        try {
            almacen().setItem(clave, JSON.stringify({fecha: new Date().toISOString(), productos}));
        } catch (error) {
            console.warn("No se pudo guardar la copia del catalogo:", error.message);
        }
    },
    leer() {
        try {
            const crudo = almacen().getItem(clave);
            if (!crudo) return null;
            const guardado = JSON.parse(crudo);
            if (!Array.isArray(guardado?.productos) || guardado.productos.length === 0) return null;
            return {productos: guardado.productos, fecha: guardado.fecha ?? null};
        } catch (error) {
            console.warn("La copia del catalogo no se pudo leer:", error.message);
            return null;
        }
    },
    olvidar() {
        try {
            almacen().removeItem(clave);
        } catch (error) {
            console.warn("No se pudo borrar la copia del catalogo:", error.message);
        }
    },
});

const cacheCatalogo = crearInstantanea(() => sessionStorage, "techcart_catalogo");

export const guardarCatalogo = (productos) => cacheCatalogo.guardar(productos);
export const leerCatalogo = () => cacheCatalogo.leer();
export const olvidarCatalogo = () => cacheCatalogo.olvidar();
