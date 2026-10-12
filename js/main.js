import { agregarAlCarrito, cambiarCantidad, faltaParaEnvioGratis, guardarCarrito, leerCarrito,
         olvidarCarrito, quitarDelCarrito, resumenCarrito } from "./carrito.js";
import { TODAS, categorias, contarPorCategoria, etiquetaCategoria } from "./datos.js";
import formatearPrecio, { formatearFecha } from "./formato.js";
import { ENVIO_GRATIS_DESDE, ORDENES, ORDEN_CATALOGO, buscar, filtrarPorCategoria, ordenar } from "./tienda.js";
import { avisoCatalogo, avisoError, avisoGuardado, botonCategoria, comprobante, errorDetalle,
         esqueletoTarjeta, fichaDetalle, fichaPedido, filaCarrito, tarjetaProducto } from "./ui.js";
import { buscarEnServidor, obtenerProducto, obtenerProductos } from "./api.js";
import { guardarCatalogo, leerCatalogo } from "./cache.js";
import { guardarPedido, leerPedidos, numeroDePedido } from "./pedidos.js";

const resumenCabecera = document.querySelector("#resumen-carrito");
const contadorCarrito = document.querySelector("#contador-carrito");
const listaCarrito = document.querySelector("#lista-carrito");
const totalCarrito = document.querySelector("#total-carrito");
const barraEnvio = document.querySelector("#barra-envio");
const mensajeEnvio = document.querySelector("#mensaje-envio");
const botonVaciar = document.querySelector("#vaciar");
const grillaCatalogo = document.querySelector("#catalogo-grid");
const estadoCatalogo = document.querySelector("#estado-catalogo");
const avisoRespaldo = document.querySelector("#aviso-respaldo");
const filtros = document.querySelector("#filtros");
const campoBuscar = document.querySelector("#buscar");
const campoOrden = document.querySelector("#orden");
const estadoBusqueda = document.querySelector("#estado-busqueda");
const dialogoDetalle = document.querySelector("#detalle");
const cuerpoDetalle = document.querySelector("#detalle-cuerpo");
const listaPedidos = document.querySelector("#lista-pedidos");
const seccionPedidos = document.querySelector("#pedidos");
const botonTema = document.querySelector("#tema");
const formularioCompra = document.querySelector("#form-compra");
const estadoPedido = document.querySelector("#estado-pedido");

const CLAVE_TEMA = "techcart_tema";
const TITULO = document.title;
const ID_AVISO_VACIO = "sin-resultados";
const DEMORA_REBOTE = 350;
const LETRAS_MINIMAS = 2;

let catalogo = [];
let categoriaActiva = TODAS;
let termino = "";
let orden = ORDEN_CATALOGO;
let resultadosServidor = [];
let abortoBusqueda = null;
let reboteBusqueda = 0;
let carrito = leerCarrito();

const mensajeDeError = (error) => {
    if (error.name === "TypeError") {
        return "No pudimos conectarnos con la tienda. Revisa tu conexion y vuelve a intentarlo.";
    }
    if (error.name === "TimeoutError") {
        return "El servidor tardo demasiado en responder. Vuelve a intentarlo en un momento.";
    }
    return error.message;
};

const unirPorId = (propios, ajenos) => {
    const porId = new Map(propios.map((producto) => [producto.id, producto]));
    ajenos.forEach((producto) => {
        if (!porId.has(producto.id)) porId.set(producto.id, producto);
    });
    return [...porId.values()];
};

const fuente = () => (resultadosServidor.length > 0 ? unirPorId(catalogo, resultadosServidor) : catalogo);

const productosVisibles = () =>
    ordenar(buscar(filtrarPorCategoria(fuente(), categoriaActiva), termino), orden);

const quitarAvisoVacio = () => {
    document.querySelector(`#${ID_AVISO_VACIO}`)?.remove();
};

const mostrarAvisoVacio = (texto) => {
    quitarAvisoVacio();
    const aviso = document.createElement("p");
    aviso.id = ID_AVISO_VACIO;
    aviso.className = "text-sm text-texto-suave my-3";
    aviso.textContent = texto;
    grillaCatalogo.insertAdjacentElement("afterend", aviso);
};

const pintarFiltros = () => {
    const encontrados = buscar(fuente(), termino);
    const cuenta = contarPorCategoria(encontrados);

    filtros.innerHTML = [
        botonCategoria(TODAS, "Todas", encontrados.length, categoriaActiva === TODAS),
        ...categorias.map((categoria) =>
            botonCategoria(categoria, etiquetaCategoria[categoria], cuenta[categoria] ?? 0,
                           categoria === categoriaActiva)),
    ].join("");
};

const pintarCatalogo = (lista = productosVisibles()) => {
    grillaCatalogo.innerHTML = lista.map(tarjetaProducto).join("");
    grillaCatalogo.setAttribute("aria-label", `Catalogo con ${lista.length} productos`);
    pintarFiltros();

    if (lista.length > 0) {
        quitarAvisoVacio();
        return;
    }

    if (termino.trim()) {
        mostrarAvisoVacio(`No encontramos nada para "${termino.trim()}". Prueba con otra palabra o quita el filtro.`);
        return;
    }

    if (catalogo.length > 0) {
        mostrarAvisoVacio("Tus filtros no dejaron ningun producto. Prueba con otra categoria.");
        return;
    }

    quitarAvisoVacio();
};

const pintarEstadoCatalogo = ({origen = "api", fecha = null, fallaron = 0} = {}) => {
    const esRespaldo = origen === "respaldo";
    avisoRespaldo.hidden = !esRespaldo;

    if (esRespaldo) {
        avisoRespaldo.textContent =
            "No pudimos conectarnos con la tienda. Estas viendo el catalogo guardado el " +
            `${formatearFecha(fecha)}, asi que los precios y el stock pueden haber cambiado.`;
    }

    if (fecha) {
        estadoCatalogo.innerHTML = avisoGuardado(
            `${catalogo.length} productos guardados el ${formatearFecha(fecha)}`);
        return;
    }

    const cuenta = contarPorCategoria(catalogo);
    const detalle = categorias
        .map((categoria) => `${etiquetaCategoria[categoria]} ${cuenta[categoria] ?? 0}`)
        .join(" - ");
    const faltantes = fallaron > 0 ? ` - ${fallaron} categoria(s) no respondieron` : "";

    estadoCatalogo.innerHTML = avisoCatalogo(`${catalogo.length} productos - ${detalle}${faltantes}`);
};

const mostrarVacio = () => {
    grillaCatalogo.innerHTML = "";
    avisoRespaldo.hidden = true;
    estadoCatalogo.innerHTML = avisoCatalogo("No hay productos para mostrar");
};

const mostrarError = (error) => {
    grillaCatalogo.innerHTML = "";
    avisoRespaldo.hidden = true;
    quitarAvisoVacio();
    estadoCatalogo.innerHTML = avisoError(mensajeDeError(error));
};

const ocuparBoton = (boton, textoOcupado) => {
    if (!boton) return () => {};
    const original = boton.textContent;
    boton.disabled = true;
    boton.textContent = textoOcupado;
    return () => {
        boton.disabled = false;
        boton.textContent = original;
    };
};

const cargarCatalogo = async ({forzar = false} = {}) => {
    if (!forzar) {
        const guardado = leerCatalogo();
        if (guardado) {
            catalogo = guardado.productos;
            pintarCatalogo();
            pintarEstadoCatalogo({origen : "cache", fecha : guardado.fecha});
            return;
        }
    }

    const boton = estadoCatalogo.querySelector("button[data-accion]");
    const soltarBoton = ocuparBoton(boton,
        boton?.dataset.accion === "actualizar" ? "Actualizando..." : "Reintentando...");

    grillaCatalogo.innerHTML = esqueletoTarjeta().repeat(8);
    quitarAvisoVacio();
    if (!boton) estadoCatalogo.innerHTML = avisoCatalogo("Cargando productos...");

    try {
        const {productos, fallaron, origen, fecha} = await obtenerProductos();
        catalogo = productos;

        if (catalogo.length === 0) {
            mostrarVacio();
            return;
        }

        if (origen === "api") guardarCatalogo(catalogo);
        pintarCatalogo();
        pintarEstadoCatalogo({origen, fecha, fallaron});
    } catch (error) {
        console.warn("No se pudo cargar el catalogo");
        mostrarError(error);
    } finally {
        soltarBoton();
    }
};

const sincronizarUrl = () => {
    const parametros = new URLSearchParams();
    if (categoriaActiva !== TODAS) parametros.set("categoria", categoriaActiva);
    if (termino.trim()) parametros.set("q", termino.trim());
    if (orden !== ORDEN_CATALOGO) parametros.set("orden", orden);

    const consulta = parametros.toString();
    history.replaceState(null, "", consulta ? `?${consulta}` : location.pathname);
};

const leerUrl = () => {
    const parametros = new URLSearchParams(location.search);

    const categoria = parametros.get("categoria");
    if (categoria === TODAS || categorias.includes(categoria)) categoriaActiva = categoria;

    const texto = parametros.get("q") ?? "";
    if (texto) {
        termino = texto;
        campoBuscar.value = texto;
    }

    const pedido = parametros.get("orden");
    if (pedido && Object.hasOwn(ORDENES, pedido)) {
        orden = pedido;
        campoOrden.value = pedido;
    }
};

const preguntarAlServidor = async (texto) => {
    abortoBusqueda = new AbortController();

    try {
        resultadosServidor = await buscarEnServidor(texto, abortoBusqueda.signal);
        estadoBusqueda.textContent = resultadosServidor.length === 0
            ? `El servidor no encontro nada para "${texto}".`
            : `${resultadosServidor.length} resultado(s) para "${texto}" en el servidor.`;
        pintarCatalogo();
    } catch (error) {
        if (error.name === "AbortError") return;
        estadoBusqueda.textContent = mensajeDeError(error);
    }
};

const programarBusqueda = () => {
    clearTimeout(reboteBusqueda);
    abortoBusqueda?.abort();

    const texto = termino.trim();

    if (texto.length < LETRAS_MINIMAS) {
        resultadosServidor = [];
        estadoBusqueda.textContent = "";
        sincronizarUrl();
        pintarCatalogo();
        return;
    }

    estadoBusqueda.textContent = `Buscando "${texto}"...`;
    reboteBusqueda = setTimeout(() => {
        sincronizarUrl();
        preguntarAlServidor(texto);
    }, DEMORA_REBOTE);
};

campoBuscar.addEventListener("input", (evento) => {
    termino = evento.target.value;
    pintarCatalogo();
    programarBusqueda();
});

campoOrden.addEventListener("change", (evento) => {
    orden = evento.target.value;
    sincronizarUrl();
    pintarCatalogo();
});

filtros.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-categoria]");
    if (!boton) return;
    categoriaActiva = boton.dataset.categoria;
    sincronizarUrl();
    pintarCatalogo();
});

estadoCatalogo.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    if (boton.dataset.accion === "reintentar") cargarCatalogo({forzar : true});
    if (boton.dataset.accion === "actualizar") cargarCatalogo({forzar : true});
});

const abrirDetalle = async (id) => {
    cuerpoDetalle.innerHTML = avisoCatalogo("Cargando el producto...");
    if (!dialogoDetalle.open) dialogoDetalle.showModal();

    try {
        cuerpoDetalle.innerHTML = fichaDetalle(await obtenerProducto(id));
    } catch (error) {
        cuerpoDetalle.innerHTML = errorDetalle(mensajeDeError(error), id);
    }
};

dialogoDetalle.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    if (boton.dataset.accion === "cerrar-detalle") dialogoDetalle.close();
    if (boton.dataset.accion === "reintentar-detalle") abrirDetalle(Number(boton.dataset.id));
});

const guardarTema = (tema) => {
    try {
        localStorage.setItem(CLAVE_TEMA, tema);
    } catch (error) {
        console.warn("No se pudo recordar el tema:", error.message);
    }
};

const pintarBotonTema = (oscuro) => {
    botonTema.textContent = oscuro ? "Modo claro" : "Modo oscuro";
    botonTema.setAttribute("aria-pressed", String(oscuro));
};

botonTema.addEventListener("click", () => {
    const oscuro = document.documentElement.classList.toggle("dark");
    guardarTema(oscuro ? "oscuro" : "claro");
    pintarBotonTema(oscuro);
});

const pintarCarrito = () => {
    const {unidades, subTotal, igv, envio, total} = resumenCarrito(carrito);

    resumenCabecera.textContent = unidades === 0
        ? "Carrito vacio"
        : `${unidades} producto(s) - ${formatearPrecio(total)}`;
    contadorCarrito.textContent = unidades;
    document.title = unidades === 0 ? TITULO : `(${unidades}) ${TITULO}`;

    listaCarrito.innerHTML = carrito.map(filaCarrito).join("");
    totalCarrito.textContent = unidades === 0 ? "Todavia no agregaste nada." :
        `Subtotal ${formatearPrecio(subTotal)} - IGV ${formatearPrecio(igv)} - ` +
        `Envio ${formatearPrecio(envio)} - Total ${formatearPrecio(total)}`;
    botonVaciar.classList.toggle("hidden", unidades === 0);

    barraEnvio.style.width = `${Math.min((subTotal / ENVIO_GRATIS_DESDE) * 100, 100)}%`;

    const falta = faltaParaEnvioGratis(subTotal);
    mensajeEnvio.textContent = falta === 0
        ? "Tu pedido ya tiene envio gratis."
        : `Te faltan ${formatearPrecio(falta)} para el envio gratis.`;
};

const pintarPedidos = () => {
    const pedidos = leerPedidos();
    seccionPedidos.hidden = pedidos.length === 0;
    listaPedidos.innerHTML = [...pedidos].reverse().map(fichaPedido).join("");

    [...pedidos].reverse().forEach((pedido, posicion) => {
        const hueco = listaPedidos.querySelectorAll("[data-cliente]")[posicion];
        if (hueco) hueco.textContent = pedido.cliente;
    });
};

grillaCatalogo.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    const id = Number(boton.dataset.id);

    if (boton.dataset.accion === "detalle") {
        abrirDetalle(id);
        return;
    }

    if (boton.dataset.accion !== "agregar") return;

    const producto = fuente().find((p) => p.id === id);
    if (!producto) return;

    carrito = agregarAlCarrito(carrito, producto);
    guardarCarrito(carrito);
    pintarCarrito();
});

listaCarrito.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    const id = Number(boton.dataset.id);
    const accion = boton.dataset.accion;

    if (accion === "mas") carrito = cambiarCantidad(carrito, id, 1);
    if (accion === "menos") carrito = cambiarCantidad(carrito, id, -1);
    if (accion === "quitar") carrito = quitarDelCarrito(carrito, id);

    guardarCarrito(carrito);
    pintarCarrito();
});

botonVaciar.addEventListener("click", () => {
    carrito = [];
    olvidarCarrito();
    pintarCarrito();
});

const mostrarAviso = (mensaje, esError) => {
    estadoPedido.innerHTML = "";
    const aviso = document.createElement("p");
    aviso.textContent = mensaje;
    aviso.classList.add("font-semibold", esError ? "text-error" : "text-exito");
    estadoPedido.append(aviso);
};

const mostrarComprobante = (pedido) => {
    estadoPedido.innerHTML = comprobante(pedido);
    estadoPedido.querySelector("[data-cliente]").textContent = pedido.cliente;
};

formularioCompra.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (!formularioCompra.checkValidity()) {
        formularioCompra.reportValidity();
        mostrarAviso("Faltan datos por completar. Revisa los campos marcados.", true);
        return;
    }

    if (carrito.length === 0) {
        mostrarAviso("Tu carrito esta vacio: agrega al menos un producto antes de confirmar.", true);
        return;
    }

    const datos = Object.fromEntries(new FormData(formularioCompra));
    const cuentas = resumenCarrito(carrito);

    const pedido = {
        numero : numeroDePedido(leerPedidos()),
        fecha : new Date().toISOString(),
        cliente : datos.nombre,
        entrega : {ciudad : datos.ciudad, pais : datos.pais, pago : datos.pago},
        lineas : carrito.map(({id, nombre, precio, cantidad}) => ({id, nombre, precio, cantidad})),
        ...cuentas,
    };

    guardarPedido(pedido);
    mostrarComprobante(pedido);

    carrito = [];
    olvidarCarrito();
    pintarCarrito();
    pintarPedidos();
    formularioCompra.reset();
});

leerUrl();
pintarBotonTema(document.documentElement.classList.contains("dark"));
pintarCarrito();
pintarPedidos();
cargarCatalogo().then(() => {
    if (termino.trim()) programarBusqueda();
});
