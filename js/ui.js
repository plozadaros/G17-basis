import formatearPrecio from "./formato.js";

const CLASES_TARJETA =
"tarjeta group flex flex-col text-center " +
"transition-[transform,box-shadow] duration-200 " +
"hover:-translate-y-1 hover:shadow-tarjeta dark:hover:ring-1 dark:hover:ring-marca " +
"animate-aparecer motion-reduce:transition-none motion-reduce:animate-none";

const CLASES_DESTACADA =
"justify-center bg-resalte border-marca border-2 md:col-span-2 md:row-span-2 " +
"before:content-['Destacado'] before:inline-block before:self-center " +
"before:text-marca before:text-xs before:font-bold before:uppercase " +
"before:tracking-wider before:border before:border-marca " +
"before:rounded-full before:px-2.5 before:py-0.5 before:mb-2 " +
"before:animate-latido motion-reduce:before:animate-none";

const CLASES_FILTRO_ACTIVO = "bg-marca text-sobre-marca border-marca";
const CLASES_FILTRO = "border-borde text-marca hover:bg-resalte";

export const botonCategoria = (valor, etiqueta, cuenta, activo) => `
    <button class="inline-flex items-center gap-1.5 border rounded-full px-4 py-1 font-semibold
                   ${activo ? CLASES_FILTRO_ACTIVO : CLASES_FILTRO}"
            type="button" data-categoria="${valor}" aria-pressed="${activo}">
        ${etiqueta}
        <span class="text-xs font-normal opacity-80">${cuenta}</span>
    </button>
`;

export const tarjetaProducto = ({destacado, id, imagen, alt, marca, nombre, precio, stock}) => `
    <article class="${CLASES_TARJETA} ${destacado ? CLASES_DESTACADA : ""}" data-id="${id}">
        <figure class="mb-3">
        ${ imagen ?
            `<img class="${destacado ? "w-full max-w-75 " : ""}aspect-square object-contain dark:brightness-90"
                src="${imagen}" alt="${alt}" width="200" />`
            :
            `<div class="w-full aspect-square grid place-items-center text-5xl bg-fondo rounded-lg"
                aria-hidden="true">📦</div>
            `
        }
            <figcaption class="text-xs font-semibold text-texto-suave uppercase tracking-wide">${marca}</figcaption>
        </figure>
        <h3 class="text-lg leading-tight my-1 group-hover:text-marca">${nombre}</h3>
        <p class="mb-3"><strong class="text-exito">${formatearPrecio(precio)}</strong></p>

        <button class="boton self-center ${destacado ? "mt-4" : "mt-auto"}" type="button"
        data-accion="agregar"
        data-id="${id}"
        aria-label="Agregar ${nombre} al carrito" ${stock === 0 ? "disabled" : ""}>
            ${stock > 0 ? "Agregar al carrito" : "Agotado"}
        </button>
    </article>
`;

export const filaCarrito = ({id, nombre, precio, cantidad}) => `
        <li class="flex flex-wrap items-center justify-between gap-2 border-b border-borde py-2">
            <span>${nombre}</span>
            <span class="flex items-center gap-3">
                <span class="inline-flex items-center gap-2">
                    <button class="boton text-sm px-2 py-0.5" type="button" data-accion="menos"
                            data-id="${id}" aria-label="Quitar una unidad de ${nombre}">&minus;</button>
                    <strong class="min-w-5 text-center">${cantidad}</strong>
                    <button class="boton text-sm px-2 py-0.5" type="button" data-accion="mas"
                            data-id="${id}" aria-label="Agregar una unidad de ${nombre}">+</button>
                </span>
                <strong class="text-exito">${formatearPrecio(precio * cantidad)}</strong>
                <button class="boton text-sm" type="button" data-accion="quitar"
                        data-id="${id}" aria-label="Quitar ${nombre} del carrito">
                    Quitar
                </button>
            </span>
        </li>
`;

export const esqueletoTarjeta = () => `
        <article class="tarjeta flex flex-col animate-pulse motion-reduce:animate-none" aria-hidden="true">
            <div class="w-full aspect-square bg-fondo-suave rounded-lg mb-3"></div>
            <div class="h-3 w-1/2 self-center bg-fondo-suave rounded-full mb-2"></div>
            <div class="h-4 w-3/4 self-center bg-fondo-suave rounded-full mb-2"></div>
            <div class="h-3 w-1/3 self-center bg-fondo-suave rounded-full mb-4"></div>
            <div class="h-9 w-2/3 self-center bg-fondo-suave rounded-full mt-auto"></div>
        </article>
`;

export const avisoCatalogo = (texto) => `
    <p class="text-sm text-texto-suave my-3">${texto}</p>
`;

export const avisoError = (mensaje) => `
    <p class="font-semibold text-error mb-3">${mensaje}</p>
    <button class="boton" type="button" data-accion="reintentar">Reintentar</button>
`;
