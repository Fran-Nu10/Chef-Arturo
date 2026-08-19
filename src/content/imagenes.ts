/**
 * Contrato de asignación de fotografías.
 *
 * El nombre del archivo decide a qué grupo pertenece una foto, y el grupo
 * decide en qué secciones puede aparecer. La posición concreta dentro de esas
 * secciones se eligió mirando cada fotografía —encuadre, orientación, luz,
 * contenido—, nunca por el número del archivo.
 *
 * Las fotos viven en `public/fotos/` y se referencian con rutas relativas.
 * Los originales no se tocan: el recorte se resuelve con `object-position`.
 */

export type GrupoFoto = 'pasteleria' | 'merienda' | 'luncheventos' | 'lamesa'

/** Prefijos del contrato. La coincidencia no distingue mayúsculas. */
const PREFIJOS: Record<GrupoFoto, string> = {
  pasteleria: 'pasteleria',
  merienda: 'merienda',
  luncheventos: 'luncheventos',
  lamesa: 'lamesadechefarturo',
}

/**
 * Deduce el grupo a partir del nombre de archivo. Cualquier archivo futuro que
 * empiece con uno de los prefijos entra en su grupo sin tocar este código.
 */
export function grupoDeArchivo(nombre: string): GrupoFoto | null {
  const base = nombre.toLowerCase().replace(/^.*\//, '')
  const orden: GrupoFoto[] = ['lamesa', 'luncheventos', 'pasteleria', 'merienda']
  return orden.find((g) => base.startsWith(PREFIJOS[g])) ?? null
}

/**
 * Dónde puede usarse cada grupo.
 *
 * `lamesa` incluye `cierre` porque el contrato dice que esas fotos pertenecen
 * "principalmente" —no exclusivamente— a su sección; hoy no se usa ninguna ahí.
 */
export const USO_PERMITIDO: Record<GrupoFoto, readonly string[]> = {
  pasteleria: ['categoria', 'seleccion', 'catalogo', 'ficha', 'hero'],
  merienda: ['categoria', 'seleccion', 'catalogo', 'ficha', 'hero'],
  luncheventos: [
    'categoria',
    'seleccion',
    'catalogo',
    'ficha',
    'hero',
    'arma-tu-ocasion',
  ],
  lamesa: ['la-mesa', 'cierre'],
}

export interface Fotografia {
  /** Ruta relativa desde `public/`. */
  archivo: string
  grupo: GrupoFoto
  /** Dimensiones reales del original: reservan la caja y evitan saltos de layout. */
  ancho: number
  alto: number
  /** Punto focal del recorte, ajustado foto por foto. */
  objectPosition?: string
  /** `contain` sólo cuando haga falta ver el producto entero. */
  objectFit?: 'cover' | 'contain'
  /**
   * Proporción del marco elegida para esta foto en particular, de modo que el
   * recorte no coma nada importante del sujeto.
   */
  ratio?: string
  /** Alt prudente: describe la escena, nunca nombra un plato sin validar. */
  alt: string
  /** Uso del contrato en el que se colocó. */
  uso: string
}

/**
 * Asignación slot → fotografía.
 *
 * Los slots `producto-<slug>` son la fuente única de la imagen de cada producto:
 * catálogo, vista rápida, ficha y carrito leen de acá, así que un producto
 * muestra siempre la misma foto en todas las pantallas.
 *
 * Un slot ausente conserva su placeholder con la leyenda del asset que falta.
 */
export const ASIGNACION: Readonly<Record<string, Fotografia>> = {
  // ─── 01 · La Vitrina Viva — arco 1 de 2 ──────────────────────────────────
  // Sujeto centrado, aire arriba y un fondo beige que es casi el papel del
  // sistema. La única con esa coincidencia cromática y resolución para escalar.
  'home-hero': {
    archivo: 'fotos/merienda1.jpg',
    grupo: 'merienda',
    ancho: 1200,
    alto: 1600,
    objectPosition: '50% 55%',
    alt: 'Una mano sostiene tres piezas dulces partidas al medio, sobre fondo claro',
    uso: 'hero',
  },

  // ─── 02 · Elegí tu ocasión — marcos rectangulares ────────────────────────
  // Las tres van en 4:5. La tabla de ratios sugería 4:3 en desktop, pero las
  // tres fotos son verticales y un 4:3 deja sólo una banda del centro: parte
  // la pila de brownies, corta los croissants y decapita la bandeja de pisos.
  'home-categoria-pasteleria': {
    archivo: 'fotos/pasteleria1.jpg',
    grupo: 'pasteleria',
    ancho: 1200,
    alto: 1800,
    ratio: '4/5',
    objectPosition: '50% 45%',
    alt: 'Piezas de pastelería apiladas en un plato, con cobertura de chocolate',
    uso: 'categoria',
  },
  'home-categoria-merienda': {
    archivo: 'fotos/merienda3.jpg',
    grupo: 'merienda',
    ancho: 1200,
    alto: 1607,
    ratio: '4/5',
    objectPosition: '50% 58%',
    alt: 'Facturas hojaldradas apiladas, con relleno de chocolate a la vista',
    uso: 'categoria',
  },
  // La bandeja de varios pisos se lee entera: cualquier recorte la decapita.
  'home-categoria-lunch': {
    archivo: 'fotos/luncheventos1.jpg',
    grupo: 'luncheventos',
    ancho: 736,
    alto: 1104,
    ratio: '4/5',
    objectFit: 'contain',
    objectPosition: '50% 50%',
    alt: 'Bandeja de varios pisos con porciones individuales de repostería',
    uso: 'categoria',
  },

  // ─── 05 · Armá tu ocasión ────────────────────────────────────────────────
  // La única con composición contextual de evento: mesa servida, no producto
  // suelto. Va al costado del formulario, nunca detrás de los campos.
  'home-arma-ocasion': {
    archivo: 'fotos/luncheventos2.jpg',
    grupo: 'luncheventos',
    ancho: 676,
    alto: 1200,
    ratio: '4/5',
    objectPosition: '50% 35%',
    alt: 'Mesa servida para un evento, con torta, bocados dulces y velas',
    uso: 'arma-tu-ocasion',
  },

  // ─── 08 · La mesa de Chef Arturo — mosaico irregular ─────────────────────
  // Los interiores aguantan el recorte panorámico. En 7, 8 y 4 el encuadre
  // apaisado bajo también sirve para dejar fuera el cartel de otro comercio,
  // las pizarras con precios ajenos y a la persona identificable.
  'mesa-1': {
    archivo: 'fotos/LamesadeChefArturo3.jpg',
    grupo: 'lamesa',
    ancho: 736,
    alto: 1103,
    ratio: '4/5',
    objectPosition: '55% 55%',
    alt: 'Interior de un salón con mostrador y mesas de madera',
    uso: 'la-mesa',
  },
  'mesa-2': {
    archivo: 'fotos/LamesadeChefArturo6.jpg',
    grupo: 'lamesa',
    ancho: 736,
    alto: 979,
    ratio: '3/2',
    objectPosition: '40% 58%',
    alt: 'Vitrina curva de un mostrador con bandejas de piezas horneadas',
    uso: 'la-mesa',
  },
  'mesa-3': {
    archivo: 'fotos/LamesadeChefArturo7.jpg',
    grupo: 'lamesa',
    ancho: 736,
    alto: 981,
    ratio: '3/2',
    objectPosition: '50% 100%',
    alt: 'Mostrador largo con bandejas de piezas saladas recién horneadas',
    uso: 'la-mesa',
  },
  'mesa-4': {
    archivo: 'fotos/LamesadeChefArturo8.jpg',
    grupo: 'lamesa',
    ancho: 736,
    alto: 981,
    ratio: '3/2',
    objectPosition: '25% 100%',
    alt: 'Bandejas de facturas hojaldradas en el mostrador de una vitrina',
    uso: 'la-mesa',
  },
  'mesa-5': {
    archivo: 'fotos/LamesadeChefArturo4.jpg',
    grupo: 'lamesa',
    ancho: 736,
    alto: 736,
    ratio: '2/1',
    objectPosition: '50% 100%',
    alt: 'Mostrador con recipientes y una vitrina iluminada',
    uso: 'la-mesa',
  },

  // ─── 10 · Cierre editorial ───────────────────────────────────────────────
  // El salón con ventanal arqueado es lo más cercano a "la vitrina está
  // abierta". El contrato dice que estas fotos son "principalmente" —no
  // exclusivamente— de su sección.
  'home-cierre': {
    archivo: 'fotos/LamesadeChefArturo.jpg',
    grupo: 'lamesa',
    ancho: 736,
    alto: 920,
    ratio: '4/5',
    objectPosition: '50% 50%',
    alt: 'Salón con mostrador de vitrina, plantas y ventanal arqueado',
    uso: 'cierre',
  },

  // ─── Productos ───────────────────────────────────────────────────────────
  // Una entrada por producto: la misma foto en catálogo, vista rápida, ficha
  // y carrito. Los productos sin entrada conservan su placeholder.
  // `producto-pasteleria-01` es además el protagonista de "Del mostrador de
  // hoy", el segundo y último arco del sistema.
  'producto-pasteleria-01': {
    archivo: 'fotos/pasteleria5.jpg',
    grupo: 'pasteleria',
    ancho: 600,
    alto: 900,
    ratio: '4/5',
    objectPosition: '50% 48%',
    alt: 'Torta fría con frutos rojos por encima, sobre una base oscura',
    uso: 'ficha',
  },
  'producto-merienda-01': {
    archivo: 'fotos/merienda4.jpg',
    grupo: 'merienda',
    ancho: 1200,
    alto: 1607,
    ratio: '4/5',
    objectPosition: '50% 55%',
    alt: 'Facturas hojaldradas apiladas, con relleno rojo de frutas',
    uso: 'ficha',
  },
  'producto-lunch-01': {
    archivo: 'fotos/luncheventos3.jpg',
    grupo: 'luncheventos',
    ancho: 736,
    alto: 981,
    ratio: '1/1',
    objectPosition: '50% 50%',
    alt: 'Bandeja completa con muchos bocados dulces ordenados en filas',
    uso: 'ficha',
  },
}

export function fotoDeSlot(slot: string): Fotografia | undefined {
  return ASIGNACION[slot]
}

/** Slots de la galería que tienen foto, en orden. */
export const SLOTS_MESA = Object.keys(ASIGNACION).filter((s) => s.startsWith('mesa-'))

/**
 * Comprueba que ninguna foto esté fuera de su grupo, que ninguna se use en una
 * sección no permitida y que ninguna se repita dentro de la home.
 * La ejecuta el script de auditoría.
 */
export function problemasDeAsignacion(): string[] {
  const problemas: string[] = []
  const enHome = new Map<string, string>()

  for (const [slot, foto] of Object.entries(ASIGNACION)) {
    const grupoReal = grupoDeArchivo(foto.archivo)
    if (grupoReal !== foto.grupo) {
      problemas.push(
        `${slot}: "${foto.archivo}" es del grupo ${grupoReal ?? 'desconocido'}, declarado como ${foto.grupo}`,
      )
    }
    if (!USO_PERMITIDO[foto.grupo].includes(foto.uso)) {
      problemas.push(`${slot}: el grupo ${foto.grupo} no puede usarse en "${foto.uso}"`)
    }
    // Todo lo que se ve en la home: hero, categorías, ocasión, galería y los
    // productos de "Selección de la casa".
    const anterior = enHome.get(foto.archivo)
    if (anterior) {
      problemas.push(`${foto.archivo} se repite: ${anterior} y ${slot}`)
    }
    enHome.set(foto.archivo, slot)
  }

  return problemas
}
