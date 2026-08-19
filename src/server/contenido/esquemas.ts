import { z } from 'zod'

/**
 * Contratos de contenido, uno por sección.
 *
 * No es un page builder: el administrador edita campos con nombre y tipo, no
 * JSON crudo ni HTML. Nada de lo que se guarda acá se interpreta como markup
 * al renderizar — todo sale como texto.
 *
 * Los enlaces se restringen a rutas internas conocidas y al WhatsApp del
 * negocio. Un campo de URL libre en un CMS es una puerta abierta a
 * `javascript:` y a redirecciones a sitios de terceros.
 */

const Texto = (max: number) => z.string().trim().max(max)
const TextoReq = (min: number, max: number) => z.string().trim().min(min).max(max)

/** Destinos permitidos para un CTA. */
export const DESTINOS_PERMITIDOS = [
  '/',
  '/catalogo',
  '/catalogo/pasteleria',
  '/catalogo/merienda',
  '/catalogo/lunch',
  '/carrito',
  '/evento',
  '/estado',
  'whatsapp',
] as const

export const Destino = z.enum(DESTINOS_PERMITIDOS, {
  message: 'Elegí uno de los destinos disponibles',
})

export const Cta = z.object({
  etiqueta: TextoReq(2, 40),
  destino: Destino,
})

const Media = z.object({
  mediaId: z.string().uuid().nullable(),
  alt: Texto(300).default(''),
})

// ── Secciones ───────────────────────────────────────────────────────────────

export const SeccionHero = z.object({
  kicker: Texto(80).default(''),
  titulo: TextoReq(4, 160),
  bajada: Texto(400).default(''),
  ctaPrimario: Cta,
  ctaSecundario: Cta.optional(),
  media: Media,
  videoPendiente: z.boolean().default(true),
})

export const SeccionCategorias = z.object({
  numero: Texto(4).default('02'),
  kicker: Texto(60).default(''),
  titulo: TextoReq(4, 120),
  // El orden lo decide el administrador; los slugs deben existir.
  ordenSlugs: z.array(z.enum(['pasteleria', 'merienda', 'lunch'])).max(3),
})

export const SeccionMostrador = z.object({
  numero: Texto(4).default('03'),
  kicker: Texto(60).default(''),
  titulo: TextoReq(4, 120),
  // Qué productos componen la selección, por id. Si uno deja de estar activo,
  // el storefront lo omite: no se muestra un producto archivado.
  productoIds: z.array(z.string().uuid()).max(12),
})

export const SeccionDetalleFinal = z.object({
  numero: Texto(4).default('04'),
  kicker: Texto(60).default(''),
  titulo: TextoReq(4, 160),
  frases: z.array(TextoReq(2, 120)).max(3).default([]),
  media: Media,
  videoUrl: z.string().url().optional(),
  videoPendiente: z.boolean().default(true),
})

export const SeccionArmaTuEvento = z.object({
  numero: Texto(4).default('05'),
  kicker: Texto(60).default(''),
  titulo: TextoReq(4, 120),
  bajada: Texto(400).default(''),
  media: Media,
  opcionesTipo: z.array(TextoReq(2, 40)).max(8),
  opcionesPersonas: z.array(TextoReq(1, 40)).max(8),
  opcionesPreferencia: z.array(TextoReq(2, 40)).max(6),
})

export const CampanaEstado = z.enum(['programada', 'activa', 'finalizada'])

export const SeccionFechasImportantes = z.object({
  numero: Texto(4).default('06'),
  kicker: Texto(60).default(''),
  titulo: TextoReq(4, 120),
  bajada: Texto(400).default(''),
  campanas: z
    .array(
      z.object({
        referencia: Texto(12).default(''),
        estado: CampanaEstado,
        titulo: TextoReq(2, 120),
        descripcion: Texto(400).default(''),
        rango: Texto(120).default(''),
        cta: Cta.optional(),
        media: Media,
        // Material de demostración, no una campaña real del negocio.
        esDemostracion: z.boolean().default(true),
      }),
    )
    .max(6)
    .default([]),
})

export const SeccionFormasDePedir = z.object({
  numero: Texto(4).default('07'),
  kicker: Texto(60).default(''),
  titulo: TextoReq(4, 120),
  pasos: z
    .array(
      z.object({
        numero: Texto(4),
        titulo: TextoReq(2, 80),
        detalle: Texto(240).default(''),
      }),
    )
    .max(8)
    .default([]),
})

export const SeccionLaMesa = z.object({
  numero: Texto(4).default('08'),
  kicker: Texto(60).default(''),
  titulo: TextoReq(4, 120),
  enlaceInstagram: Cta.optional(),
  piezas: z
    .array(
      z.object({
        media: Media,
        ratio: z.enum(['4/5', '1/1', '3/2', '2/1']).default('4/5'),
        ancho: z.coerce.number().int().min(120).max(600).default(260),
      }),
    )
    .max(16)
    .default([]),
})

export const SeccionCtaFinal = z.object({
  kicker: Texto(80).default(''),
  titulo: TextoReq(4, 160),
  ctaPrimario: Cta,
  ctaSecundario: Cta.optional(),
  nota: Texto(200).default(''),
  media: Media,
})

export const SeccionFooter = z.object({
  leyenda: Texto(300).default(''),
  mostrarUbicacion: z.boolean().default(true),
})

/** Registro de todas las secciones administrables. */
export const ESQUEMAS_SECCION = {
  hero: SeccionHero,
  categorias: SeccionCategorias,
  mostrador: SeccionMostrador,
  'detalle-final': SeccionDetalleFinal,
  'arma-tu-evento': SeccionArmaTuEvento,
  'fechas-importantes': SeccionFechasImportantes,
  'formas-de-pedir': SeccionFormasDePedir,
  'la-mesa': SeccionLaMesa,
  'cta-final': SeccionCtaFinal,
  footer: SeccionFooter,
} as const

export type ClaveSeccion = keyof typeof ESQUEMAS_SECCION

export const CLAVES_SECCION = Object.keys(ESQUEMAS_SECCION) as ClaveSeccion[]

export function esClaveSeccion(valor: string): valor is ClaveSeccion {
  return valor in ESQUEMAS_SECCION
}

/**
 * Valida el contenido de una sección contra su propio contrato.
 * Devuelve errores por campo, listos para pintar junto a cada input.
 */
export function validarSeccion(
  clave: ClaveSeccion,
  valor: unknown,
):
  | { ok: true; datos: unknown }
  | { ok: false; errores: { campo: string; mensaje: string }[] } {
  const resultado = ESQUEMAS_SECCION[clave].safeParse(valor)
  if (resultado.success) return { ok: true, datos: resultado.data }
  return {
    ok: false,
    errores: resultado.error.issues.map((i) => ({
      campo: i.path.join('.') || '(sección)',
      mensaje: i.message,
    })),
  }
}

/** Extrae los ids de medios de una sección, para saber qué archivos usa. */
export function mediosDeSeccion(valor: unknown): string[] {
  const encontrados = new Set<string>()
  const recorrer = (nodo: unknown) => {
    if (Array.isArray(nodo)) {
      nodo.forEach(recorrer)
      return
    }
    if (nodo && typeof nodo === 'object') {
      for (const [clave, hijo] of Object.entries(nodo as Record<string, unknown>)) {
        if (clave === 'mediaId' && typeof hijo === 'string') encontrados.add(hijo)
        else recorrer(hijo)
      }
    }
  }
  recorrer(valor)
  return [...encontrados]
}

/** Traduce un destino permitido a una URL real. */
export function resolverDestino(destino: string, whatsapp: string): string {
  return destino === 'whatsapp' ? whatsapp : destino
}
