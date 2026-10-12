import { agregarAlCarrito, cambiarCantidad, faltaParaEnvioGratis, guardarCarrito, leerCarrito,
         olvidarCarrito, quitarDelCarrito, resumenCarrito } from "./carrito.js";
import { TODAS, categorias, contarPorCategoria, etiquetaCategoria } from "./datos.js";
import formatearPrecio, { formatearFecha } from "./formato.js";
import { ENVIO_GRATIS_DESDE, filtrarPorCategoria } from "./tienda.js";
import { avisoCatalogo, avisoError, avisoGuardado, botonCategoria, errorDetalle, esqueletoTarjeta,
         fichaDetalle, filaCarrito, tarjetaProducto } from "./ui.js";
import { buscarEnServidor, obtenerProducto, obtenerProductos } from "./api.js";
import { guardarCatalogo, leerCatalogo } from "./cache.js";

const resumenCabecera = document.querySelector("#resumen-carrito");
const contadorCarrito = document.querySelector("#contador-carrito");
const listaCarrito = document.querySelector("#lista-carrito");
const totalCarrito = document.querySelector("#total-carrito");
const barraEnvio = document.querySelector("#barra-envio");
const mensajeEnvio = document.querySelector("#mensaje-envio");
const botonVaciar = document.querySelector("#vaciar");
const grillaCatalogo = document.querySelector("#catalogo-grid");
const estadoCatalogo = document.querySelector("#estado-catalogo");
const filtros = document.querySelector("#filtros");
const campoBuscar = document.querySelector("#buscar");
const estadoBusqueda = document.querySelector("#estado-busqueda");
const dialogoDetalle = document.querySelector("#detalle");
const cuerpoDetalle = document.querySelector("#detalle-cuerpo");
const botonTema = document.querySelector("#tema");

const CLAVE_TEMA = "techcart_tema";
const TITULO = document.title;
const ID_AVISO_VACIO = "sin-resultados";
const DEMORA_REBOTE = 350;
const LETRAS_MINIMAS = 2;

let catalogo = [];
let categoriaActiva = TODAS;
let termino = "";
let resultadosServidor = [];
let abortoBusqueda = null;
let reboteBusqueda = 0;

const mensajeDeError = (error) => {
    if (error.name === "TypeError") {
        return "No pudimos conectarnos con la tienda. Revisa tu conexion y vuelve a intentarlo.";
    }
    if (error.name === "TimeoutError") {
        return "El servidor tardo demasiado en responder. Vuelve a intentarlo en un momento.";
    }
    return error.message;
};

const buscando = () => termino.trim().length >= LETRAS_MINIMAS;
const fuente = () => (buscando() ? resultadosServidor : catalogo);
const productosVisibles = () => filtrarPorCategoria(fuente(), categoriaActiva);

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
    const cuenta = contarPorCategoria(fuente());
    filtros.innerHTML = [
        botonCategoria(TODAS, "Todas", fuente().length, categoriaActiva === TODAS),
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

    if (buscando()) {
        mostrarAvisoVacio(`No encontramos nada para "${termino.trim()}". Prueba con otra palabra o quita el filtro.`);
        return;
    }

    if (catalogo.length > 0) {
        mostrarAvisoVacio("Tus filtros no dejaron ningun producto. Prueba con otra categoria.");
        return;
    }

    quitarAvisoVacio();
};

const mostrarExito = (lista, {fallaron = 0, fecha = null} = {}) => {
    const cuenta = contarPorCategoria(lista);
    const detalle = categorias
        .map((categoria) => `${etiquetaCategoria[categoria]} ${cuenta[categoria] ?? 0}`)
        .join(" - ");
    const faltantes = fallaron > 0
        ? ` - ${fallaron} categoria(s) no respondieron`
        : "";

    estadoCatalogo.innerHTML = fecha
        ? avisoGuardado(`${lista.length} productos guardados el ${formatearFecha(fecha)}${faltantes}`)
        : avisoCatalogo(`${lista.length} productos - ${detalle}${faltantes}`);
};

const mostrarVacio = () => {
    grillaCatalogo.innerHTML = "";
    estadoCatalogo.innerHTML = avisoCatalogo("No hay productos para mostrar");
};

const mostrarError = (error) => {
    grillaCatalogo.innerHTML = "";
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
            mostrarExito(catalogo, {fecha : guardado.fecha});
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
        const {productos, fallaron} = await obtenerProductos();
        catalogo = productos;

        if (catalogo.length === 0) {
            mostrarVacio();
            return;
        }

        guardarCatalogo(catalogo);
        pintarCatalogo();
        mostrarExito(catalogo, {fallaron});
    } catch (error) {
        console.warn("No se pudo cargar el catalogo");
        mostrarError(error);
    } finally {
        soltarBoton();
    }
};

estadoCatalogo.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    if (boton.dataset.accion === "reintentar") cargarCatalogo({forzar : true});
    if (boton.dataset.accion === "actualizar") cargarCatalogo({forzar : true});
});

filtros.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-categoria]");
    if (!boton) return;
    categoriaActiva = boton.dataset.categoria;
    pintarCatalogo();
});

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

campoBuscar.addEventListener("input", (evento) => {
    termino = evento.target.value;
    clearTimeout(reboteBusqueda);
    abortoBusqueda?.abort();

    if (!buscando()) {
        resultadosServidor = [];
        estadoBusqueda.textContent = "";
        pintarCatalogo();
        return;
    }

    estadoBusqueda.textContent = `Buscando "${termino.trim()}"...`;
    reboteBusqueda = setTimeout(() => preguntarAlServidor(termino.trim()), DEMORA_REBOTE);
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

let carrito = leerCarrito();

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

const formularioCompra = document.querySelector("#form-compra");
const estadoPedido = document.querySelector("#estado-pedido");

const mostrarAviso = (mensaje, esError) => {
    estadoPedido.querySelector("p")?.remove();
    const aviso = document.createElement("p");
    aviso.textContent = mensaje;
    aviso.classList.add("font-semibold", esError ? "text-error" : "text-exito");
    estadoPedido.append(aviso);
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

    const datos = new FormData(formularioCompra);
    const nombre = datos.get("nombre");
    const {unidades, total} = resumenCarrito(carrito);

    mostrarAviso(
        `Gracias, ${nombre}. Tu pedido de ${carrito.length} producto(s) y ${unidades} unidad(es) ` +
        `por ${formatearPrecio(total)} quedo registrado.`, false
    );
    formularioCompra.reset();
});

pintarBotonTema(document.documentElement.classList.contains("dark"));
pintarCarrito();
cargarCatalogo();
