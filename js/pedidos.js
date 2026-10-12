const CLAVE_PEDIDOS = "techcart_pedidos";

export const leerPedidos = () => {
    try {
        const crudo = localStorage.getItem(CLAVE_PEDIDOS);
        const guardados = crudo ? JSON.parse(crudo) : [];
        return Array.isArray(guardados) ? guardados : [];
    } catch (error) {
        console.warn("Los pedidos guardados no se pudieron leer:", error.message);
        return [];
    }
};

export const guardarPedido = (pedido) => {
    const pedidos = [...leerPedidos(), pedido];

    try {
        localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));
    } catch (error) {
        console.warn("No se pudo guardar el pedido:", error.message);
    }

    return pedidos;
};

export const numeroDePedido = (pedidos) => `TC-${String(pedidos.length + 1).padStart(4, "0")}`;
