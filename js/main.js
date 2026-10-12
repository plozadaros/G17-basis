import { agregarAlCarrito, cambiarCantidad, faltaParaEnvioGratis, guardarCarrito, leerCarrito,
         olvidarCarrito, quitarDelCarrito, resumenCarrito } from "./carrito.js";
import { TODAS, categorias, contarPorCategoria, etiquetaCategoria } from "./datos.js";
import formatearPrecio from "./formato.js";
import { ENVIO_GRATIS_DESDE, filtrarPorCategoria } from "./tienda.js";
import { botonCategoria, filaCarrito, tarjetaProducto, esqueletoTarjeta, avisoCatalogo, avisoError } from "./ui.js";
import { obtenerProductos } from "./api.js";

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
const botonTema = document.querySelector("#tema");

const CLAVE_TEMA = "techcart_tema";
const TITULO = document.title;
const ID_AVISO_VACIO = "sin-resultados";

let catalogo = [];
let categoriaActiva = TODAS;

const mensajeDeError = (error) => {
    if (error.name === "TypeError") {
        return "No pudimos conectarnos con la tienda. Revisa tu conexion y vuelve a intentarlo.";
    }
    if (error.name === "TimeoutError") {
        return "El servidor tardo demasiado en responder. Vuelve a intentarlo en un momento.";
    }
    return error.message;
};

const productosVisibles = () => filtrarPorCategoria(catalogo, categoriaActiva);

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
    const cuenta = contarPorCategoria(catalogo);
    filtros.innerHTML = [
        botonCategoria(TODAS, "Todas", catalogo.length, categoriaActiva === TODAS),
        ...categorias.map((categoria) =>
            botonCategoria(categoria, etiquetaCategoria[categoria], cuenta[categoria] ?? 0,
                           categoria === categoriaActiva)),
    ].join("");
};

const pintarCatalogo = (lista = productosVisibles()) => {
    grillaCatalogo.innerHTML = lista.map(tarjetaProducto).join("");
    grillaCatalogo.setAttribute("aria-label", `Catalogo con ${lista.length} productos`);
    pintarFiltros();

    if (lista.length === 0 && catalogo.length > 0) {
        mostrarAvisoVacio("Tus filtros no dejaron ningun producto. Prueba con otra categoria.");
        return;
    }
    quitarAvisoVacio();
};

const mostrarCargando = () => {
    grillaCatalogo.innerHTML = esqueletoTarjeta().repeat(8);
    estadoCatalogo.innerHTML = avisoCatalogo("Cargando productos...");
};

const mostrarExito = (lista) => {
    const cuenta = contarPorCategoria(lista);
    const detalle = categorias
        .map((categoria) => `${etiquetaCategoria[categoria]} ${cuenta[categoria] ?? 0}`)
        .join(" - ");
    estadoCatalogo.innerHTML = avisoCatalogo(`${lista.length} productos - ${detalle}`);
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

const cargarCatalogo = async () => {
    mostrarCargando();
    try {
        catalogo = await obtenerProductos();
        if (catalogo.length === 0) {
            mostrarVacio();
            return;
        }
        pintarCatalogo();
        mostrarExito(catalogo);
    } catch (error) {
        console.warn("No se pudo cargar el catalogo");
        mostrarError(error);
    }
};

estadoCatalogo.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-accion='reintentar']");
    if (!boton) return;
    cargarCatalogo();
});

filtros.addEventListener("click", (evento) => {
    const boton = evento.target.closest("button[data-categoria]");
    if (!boton) return;
    categoriaActiva = boton.dataset.categoria;
    pintarCatalogo();
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
    const boton = evento.target.closest("button[data-accion='agregar']");
    if (!boton) return;

    const id = Number(boton.dataset.id);
    const producto = catalogo.find((p) => p.id === id);
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
