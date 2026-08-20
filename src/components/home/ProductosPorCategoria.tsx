'use client'

import Image from 'next/image'
import Link from 'next/link'
import { NEGOCIO } from '@/content/datos'
import type { Categoria, Producto } from '@/content/tipos'
import { BotonEnlace } from '@/components/ui/Boton'
import { EncabezadoSeccion, Reveal } from '@/components/ui/Reveal'
import { TagModalidad } from '@/components/ui/TagModalidad'
import { useAgregar } from '@/lib/agregar'

/**
 * 03 · CATÁLOGO — productos agrupados por las categorías reales de Supabase.
 *
 * Reemplaza a "Del mostrador de hoy": no hay selección manual, ni protagonista
 * con arco, ni dependencia de `is_featured`. El dueño administra categorías y
 * productos desde el panel y esta sección refleja eso tal cual: categorías
 * activas en su orden de posición, hasta ocho productos activos por bloque,
 * ordenados por la posición configurada.
 *
 * Desktop: grilla de 4 columnas (máximo dos filas). Tablet: 2 columnas.
 * Mobile: un carrusel horizontal nativo por categoría — `overflow-x: auto` con
 * scroll-snap, sin drag artificial— que muestra ~1,15 cards para insinuar que
 * se puede deslizar.
 */

/** Producto del catálogo público, con su foto real de Storage si existe. */
export interface ProductoDeCatalogo extends Producto {
  imagenUrl: string | null
  imagenAlt: string
}

interface Props {
  categorias: Categoria[]
  productos: ProductoDeCatalogo[]
  /** La base respondió pero todavía no hay nada cargado. */
  vacio: boolean
  /** La base no respondió; distinto de "vacío" y con otro mensaje. */
  caido: boolean
}

const MAX_POR_CATEGORIA = 8

/** Padding lateral del sistema; el carrusel lo usa también como scroll-padding. */
const PX = 'px-[clamp(16px,3.4vw,48px)]'

export function ProductosPorCategoria({ categorias, productos, vacio, caido }: Props) {
  // Las categorías ya llegan ordenadas por su posición de Supabase
  // (10 pastelería · 20 merienda · 30 salados · 40 lunch). Un bloque sin
  // productos activos se omite: mejor ninguna sección que una vacía.
  const bloques = categorias
    .map((categoria) => ({
      categoria,
      productos: productos
        .filter((p) => p.categoria === categoria.slug)
        .slice(0, MAX_POR_CATEGORIA),
    }))
    .filter((b) => b.productos.length > 0)

  return (
    <section
      aria-label="Catálogo por categorías"
      className="border-t border-linea pt-[clamp(40px,5vw,72px)] pb-[clamp(56px,7vw,96px)]"
    >
      <EncabezadoSeccion
        numero="03"
        kicker="CATÁLOGO"
        titulo="Elegí lo que más te guste"
        bajada="Pastelería, merienda, salados y propuestas de lunch para cada ocasión."
        className={`${PX} mb-[clamp(28px,3.5vw,44px)]`}
      />

      {caido || vacio || bloques.length === 0 ? (
        <EstadoSinCatalogo caido={caido} />
      ) : (
        <div className="flex flex-col gap-[clamp(40px,5vw,64px)]">
          {bloques.map(({ categoria, productos: lista }) => (
            <BloqueCategoria key={categoria.slug} categoria={categoria} productos={lista} />
          ))}
        </div>
      )}
    </section>
  )
}

/**
 * Catálogo vacío o base caída. Compacto, con la salida por WhatsApp: no se
 * rellena con productos de ejemplo ni se devuelve un error.
 */
function EstadoSinCatalogo({ caido }: { caido: boolean }) {
  return (
    <div className={PX}>
      <div className="flex flex-col items-start gap-4 rounded-borde border border-dashed border-linea-fuerte bg-crema/50 px-5 py-8 lg:px-8">
        <p className="m-0 font-display text-xl text-tinta">
          {caido
            ? 'No pudimos consultar el catálogo en este momento.'
            : 'Estamos preparando el catálogo.'}
        </p>
        <p className="m-0 max-w-[480px] text-[13px] leading-relaxed text-tinta-suave">
          {caido
            ? 'Volvé a intentarlo en un rato. Si te urge, escribinos y te contamos qué hay.'
            : 'Muy pronto vas a poder ver acá todos los productos. Mientras tanto, escribinos y te contamos qué hay.'}
        </p>
        <BotonEnlace href={NEGOCIO.whatsapp} variante="secundario" compacto>
          Escribinos por WhatsApp
        </BotonEnlace>
      </div>
    </div>
  )
}

function BloqueCategoria({
  categoria,
  productos,
}: {
  categoria: Categoria
  productos: ProductoDeCatalogo[]
}) {
  const idTitulo = `catalogo-${categoria.slug}`

  return (
    <div aria-labelledby={idTitulo} role="group">
      <Reveal className={`${PX} mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5`}>
        <div>
          <h3 id={idTitulo} className="m-0 font-display text-[clamp(22px,2.6vw,30px)] font-normal text-tinta">
            {categoria.nombre}
          </h3>
          {categoria.descripcion && (
            <p className="m-0 mt-0.5 max-w-[440px] text-[12.5px] leading-relaxed text-tinta-suave">
              {categoria.descripcion}
            </p>
          )}
        </div>
        <Link
          href={`/catalogo/${categoria.slug}`}
          className="inline-flex min-h-[44px] items-center text-[12.5px] font-semibold tracking-[0.03em] text-verde underline decoration-transparent underline-offset-4 transition-colors duration-200 hover:decoration-caramelo focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde"
        >
          Ver toda la categoría →
        </Link>
      </Reveal>

      {/*
        Un solo DOM para los tres anchos. En mobile es un carrusel de scroll
        nativo (snap obligatorio, scrollbar oculta, foco posible para poder
        desplazarlo con el teclado); desde `sm` pasa a grilla y el overflow, el
        snap y el ancho fijo de card se anulan.
      */}
      <div
        role="region"
        aria-label={`Productos de ${categoria.nombre}`}
        tabIndex={0}
        className={`flex snap-x snap-mandatory gap-3 overflow-x-auto ${PX} scroll-px-[clamp(16px,3.4vw,48px)] pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-verde sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 lg:grid-cols-4 lg:gap-5`}
      >
        {productos.map((producto) => (
          <div key={producto.slug} className="w-[82%] flex-none snap-start sm:w-auto">
            <CardCatalogo producto={producto} />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Card comercial de e-commerce: imagen 4/5 arriba, nombre a dos líneas,
 * precio siempre en la misma zona, nota operativa y una acción según la
 * modalidad real del producto. Rectangular, borde fino, sin sombras ni arcos.
 */
function CardCatalogo({ producto }: { producto: ProductoDeCatalogo }) {
  const agotado =
    producto.disponibilidad === 'agotado' || producto.disponibilidad === 'no-disponible'

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-borde border border-linea bg-papel transition-colors duration-200 hover:border-linea-fuerte ${
        agotado ? 'opacity-60' : ''
      }`}
    >
      <Link
        href={`/producto/${producto.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-crema no-underline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-verde"
        aria-label={`Ver ${producto.nombre}`}
      >
        {producto.imagenUrl ? (
          <Image
            src={producto.imagenUrl}
            alt={producto.imagenAlt || producto.nombre}
            fill
            sizes="(max-width: 639px) 82vw, (max-width: 1023px) 46vw, 23vw"
            className="object-cover transition-transform duration-[240ms] ease-editorial group-hover:scale-[1.04]"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-tinta-tenue"
          >
            {/* Placeholder limpio: misma caja que una foto real, sin drama. */}
            <span className="h-8 w-8 rounded-full border border-linea-fuerte" />
            <span className="text-[10.5px] font-medium tracking-[0.04em]">
              Imagen próximamente
            </span>
          </span>
        )}
        {(producto.modalidad !== 'directa' || producto.disponibilidad !== 'disponible') && (
          <span className="absolute top-2 left-2 bg-papel/95">
            <TagModalidad
              modalidad={producto.modalidad}
              disponibilidad={producto.disponibilidad}
              corto
              className="text-[9.5px]"
            />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link
          href={`/producto/${producto.slug}`}
          className="block font-display text-[16.5px] leading-[21px] text-tinta no-underline group-hover:underline group-hover:decoration-caramelo group-hover:underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde"
        >
          {/* Dos líneas reservadas: el precio arranca a la misma altura en todas. */}
          <span className="line-clamp-2 min-h-[42px]">{producto.nombre}</span>
        </Link>

        <div className="text-[13px] font-semibold text-verde">{producto.precio}</div>

        {/* Espacio siempre reservado: con o sin nota, todas las cards miden igual. */}
        <p className="m-0 line-clamp-2 min-h-[30px] text-[11px] leading-[15px] text-tinta-suave">
          {producto.nota ?? ''}
        </p>

        <div className="mt-auto pt-2.5">
          <AccionDeCard producto={producto} agotado={agotado} />
        </div>
      </div>
    </article>
  )
}

/**
 * La acción respeta la modalidad real:
 *   directa  → Agregar (ciclo del carrito existente, con confirmación visual),
 *   encargo  → Encargar (a la ficha, donde se elige y coordina la fecha),
 *   consultar→ Consultar (WhatsApp real, con el producto precargado).
 * Nunca se agrega en silencio un encargo ni se ofrece carrito para un quote.
 */
function AccionDeCard({
  producto,
  agotado,
}: {
  producto: ProductoDeCatalogo
  agotado: boolean
}) {
  // El hook se llama siempre (regla de los hooks); sólo lo usa `directa`.
  const { estado, activar, aspecto } = useAgregar(producto)

  const CLASE_BASE =
    'inline-flex min-h-[44px] w-full items-center justify-center px-4 text-[13px] font-semibold tracking-[0.03em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde'

  if (producto.modalidad === 'consultar') {
    const mensaje = encodeURIComponent(`Hola, quiero consultar por ${producto.nombre}.`)
    return (
      <a
        href={`${NEGOCIO.whatsapp}?text=${mensaje}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${CLASE_BASE} border border-verde bg-transparent text-verde no-underline hover:bg-verde/[0.07] group-hover:bg-verde/[0.07]`}
      >
        Consultar
      </a>
    )
  }

  if (producto.modalidad === 'encargo') {
    return (
      <Link
        href={`/producto/${producto.slug}`}
        className={`${CLASE_BASE} border border-verde bg-transparent text-verde no-underline hover:bg-verde/[0.07] group-hover:bg-verde/[0.07]`}
      >
        Encargar
      </Link>
    )
  }

  // Etiquetas compactas para la card; el ciclo y los colores son los del
  // sistema (`useAgregar`), así el feedback es idéntico al del resto del sitio.
  const etiqueta = agotado
    ? aspecto.etiqueta
    : estado === 'agregando'
      ? 'Agregando…'
      : estado === 'agregado'
        ? 'Agregado ✓'
        : 'Agregar'

  return (
    <button
      type="button"
      onClick={activar}
      disabled={aspecto.deshabilitado}
      aria-live="polite"
      aria-label={estado === 'reposo' && !agotado ? `Agregar ${producto.nombre}` : undefined}
      className={`${CLASE_BASE} ${aspecto.clase}`}
    >
      {etiqueta}
    </button>
  )
}
