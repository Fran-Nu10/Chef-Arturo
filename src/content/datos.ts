import type {
  Campana,
  Categoria,
  ItemGaleria,
  PasoPedido,
  Pregunta,
  Producto,
} from './tipos'

/** Datos del negocio que ya están validados por el brief. */
export const NEGOCIO = {
  nombre: 'Chef Arturo',
  autoras: 'by Julia Montserrat',
  ciudad: 'Florida, Uruguay',
  entrega: 'retiro y entrega',
  // Número confirmado por la casa (docs/CATALOGO_REAL_V1.md). El secundario,
  // 099 079 177, no tiene un CTA propio en la interfaz: no se agrega un
  // segundo botón de WhatsApp que el diseño aprobado no contempla.
  whatsapp: 'https://wa.me/59899786781',
  ubicacion: 'Florida, Uruguay · Lunes a sábado',
} as const

export const CATEGORIAS: Categoria[] = [
  {
    slug: 'pasteleria',
    nombre: 'Pastelería',
    numero: '01',
    descripcion: 'Tortas y piezas dulces. Compra directa o por encargo con fecha.',
    cta: 'Ver pastelería',
    imagenPendiente: 'Imagen temporal — pastelería',
  },
  {
    slug: 'merienda',
    nombre: 'Merienda',
    numero: '02',
    descripcion: 'Para la tarde, del día. Retiro en Florida o entrega a tu puerta.',
    cta: 'Ver merienda',
    imagenPendiente: 'Imagen temporal — merienda',
  },
  {
    slug: 'lunch',
    nombre: 'Lunch para eventos',
    numero: '03',
    descripcion: 'Fiestas y reuniones. Propuesta con cotización previa.',
    cta: 'Consultar por tu evento',
    imagenPendiente: 'Imagen temporal — lunch para eventos',
  },
]

/**
 * Catálogo placeholder. Los nombres son genéricos a propósito: no se inventan
 * productos, precios, ingredientes ni porciones.
 */
export const PRODUCTOS: Producto[] = [
  {
    slug: 'pasteleria-01',
    nombre: 'Producto de pastelería',
    categoria: 'pasteleria',
    modalidad: 'directa',
    disponibilidad: 'disponible',
    precio: 'Precio pendiente',
    imagenPendiente: 'Imagen temporal — producto',
  },
  {
    slug: 'merienda-01',
    nombre: 'Producto de merienda',
    categoria: 'merienda',
    modalidad: 'directa',
    disponibilidad: 'disponible',
    precio: 'Precio pendiente',
    imagenPendiente: 'Imagen temporal',
  },
  {
    slug: 'pasteleria-02',
    nombre: 'Producto de pastelería',
    categoria: 'pasteleria',
    modalidad: 'encargo',
    disponibilidad: 'disponible',
    precio: 'Precio pendiente',
    nota: 'Anticipación por confirmar',
    imagenPendiente: 'Imagen temporal',
  },
  {
    slug: 'lunch-01',
    nombre: 'Producto de lunch',
    categoria: 'lunch',
    modalidad: 'consultar',
    disponibilidad: 'requiere-fecha',
    precio: 'Con cotización previa',
    nota: 'Para eventos',
    imagenPendiente: 'Imagen temporal',
  },
  {
    slug: 'merienda-02',
    nombre: 'Producto de merienda',
    categoria: 'merienda',
    modalidad: 'directa',
    disponibilidad: 'agotado',
    precio: 'Precio pendiente',
    nota: 'Agotado hoy',
    imagenPendiente: 'Imagen temporal',
  },
  {
    slug: 'pasteleria-03',
    nombre: 'Producto de pastelería',
    categoria: 'pasteleria',
    modalidad: 'directa',
    disponibilidad: 'disponible',
    precio: 'Precio pendiente',
    imagenPendiente: 'Imagen temporal',
  },
  {
    slug: 'pasteleria-04',
    nombre: 'Producto de pastelería',
    categoria: 'pasteleria',
    modalidad: 'directa',
    disponibilidad: 'disponible',
    precio: 'Precio pendiente',
    imagenPendiente: 'Imagen temporal',
  },
  {
    slug: 'merienda-03',
    nombre: 'Producto de merienda',
    categoria: 'merienda',
    modalidad: 'directa',
    disponibilidad: 'no-disponible',
    precio: 'Precio pendiente',
    nota: 'Vuelve a la vitrina próximamente.',
    imagenPendiente: 'Imagen temporal',
  },
]

/** Los cinco productos que arma la "Selección de la casa" de la home. */
export const SELECCION_HOME = [
  'pasteleria-01',
  'merienda-01',
  'pasteleria-02',
  'lunch-01',
  'merienda-02',
]

/**
 * Las tres formas de comprar de la casa, que es lo único cierto que hay para
 * poner acá hoy.
 *
 * Antes había tres campañas de ejemplo con fechas inventadas. No se
 * reemplazaron por campañas reales porque no hay ninguna: la sección es
 * administrable y Julia puede cargarlas cuando existan. Mientras tanto dice
 * algo verdadero en vez de "pendiente de validación".
 *
 * Las tres van en `activa` a propósito. `programada` y `finalizada` siguen
 * existiendo en el tipo y en los estilos, para cuando haya campañas de verdad.
 *
 * Sin `cta`: el botón de la tarjeta todavía no lleva a ninguna parte, y tres
 * botones muertos son peores que ninguno.
 */
export const CAMPANAS: Campana[] = [
  {
    id: 'compra-del-dia',
    referencia: 'A·01',
    estado: 'activa',
    titulo: 'Compra del día',
    descripcion:
      'Lo que está en la vitrina hoy, con pago online por Mercado Pago.',
    rango: 'Lunes a sábado',
    imagenPendiente: 'Imagen o video temporal',
  },
  {
    id: 'encargo-con-fecha',
    referencia: 'A·02',
    estado: 'activa',
    titulo: 'Encargo con fecha',
    descripcion:
      'Las tortas enteras por kilo y el Box Colección Dulce se preparan para el día que elijas.',
    rango: 'Con 24 horas de anticipación',
    imagenPendiente: 'Imagen temporal',
  },
  {
    id: 'lunch-para-eventos',
    referencia: 'A·03',
    estado: 'activa',
    titulo: 'Lunch para eventos',
    descripcion:
      'Cumpleaños, reuniones y eventos de trabajo. Se cotiza por ocasión, cantidad de personas y fecha.',
    rango: 'A coordinar por WhatsApp',
    imagenPendiente: 'Imagen temporal',
  },
]

export const PASOS_PEDIDO: PasoPedido[] = [
  {
    numero: '01',
    titulo: 'Comprá directamente',
    detalle: 'Del stock del día, con pago online por Mercado Pago.',
  },
  {
    numero: '02',
    titulo: 'Encargá para una fecha',
    detalle: 'Los enteros se encargan con 24 horas de anticipación.',
  },
  {
    numero: '03',
    titulo: 'Consultá por tu evento',
    detalle: 'Lunch para fiestas con cotización previa.',
  },
  {
    numero: '04',
    titulo: 'Elegí retiro o entrega',
    detalle: 'Retiro en Florida o directo a tu puerta.',
  },
  {
    numero: '05',
    titulo: 'Recibí confirmación',
    detalle: 'Te confirmamos disponibilidad y detalle del pedido.',
  },
]

/** Dos rieles a distinta velocidad. El orden es administrable. */
export const GALERIA_RIEL_1: ItemGaleria[] = [
  {
    id: 'mesa-1',
    tipo: 'foto',
    orientacion: 'vertical',
    alt: 'Foto vertical — temporal',
  },
  {
    id: 'mesa-2',
    tipo: 'foto',
    orientacion: 'horizontal',
    alt: 'Foto horizontal — temporal',
  },
  {
    id: 'mesa-3',
    tipo: 'video',
    orientacion: 'vertical',
    alt: 'Video breve — poster temporal',
  },
  {
    id: 'mesa-4',
    tipo: 'foto',
    orientacion: 'horizontal',
    alt: 'Foto horizontal — temporal',
  },
  {
    id: 'mesa-5',
    tipo: 'foto',
    orientacion: 'vertical',
    alt: 'Foto vertical — temporal',
  },
]

export const GALERIA_RIEL_2: ItemGaleria[] = [
  {
    id: 'mesa-6',
    tipo: 'foto',
    orientacion: 'horizontal',
    alt: 'Foto horizontal — temporal',
  },
  {
    id: 'mesa-7',
    tipo: 'foto',
    orientacion: 'vertical',
    alt: 'Foto vertical — temporal',
  },
  {
    id: 'mesa-8',
    tipo: 'foto',
    orientacion: 'horizontal',
    alt: 'Foto horizontal — temporal',
  },
]

/**
 * Preguntas frecuentes.
 *
 * Cada respuesta sale de lo que la casa confirmó —ubicación, días y horario,
 * retiro y entrega, las 24 horas de anticipación de los enteros— o de lo que
 * la propia aplicación hace, como el cobro por Mercado Pago. Lo que la casa no
 * informó (la dirección exacta, la política de seña, las zonas de entrega) se
 * deriva a WhatsApp en lugar de completarse con una respuesta inventada.
 */
export const PREGUNTAS: Pregunta[] = [
  {
    pregunta: '¿Con cuánta anticipación encargo?',
    respuesta:
      'Las tortas enteras por kilo y el Box Colección Dulce se encargan con 24 horas de anticipación. Lo que está en compra directa sale del stock del día. Para un evento, escribinos y lo coordinamos.',
  },
  {
    pregunta: '¿Dónde retiro mi pedido?',
    respuesta:
      'En Florida, Uruguay. Te pasamos el punto exacto por WhatsApp cuando confirmamos el pedido.',
  },
  {
    pregunta: '¿Hacen entregas?',
    respuesta:
      'Sí, además del retiro entregamos a domicilio. Escribinos por WhatsApp con tu dirección y coordinamos día y horario.',
  },
  {
    pregunta: '¿Cómo pago?',
    respuesta:
      'Con Mercado Pago desde la web, o coordinando por WhatsApp si preferís.',
  },
  {
    pregunta: '¿Cuándo se pide seña?',
    respuesta:
      'Los pedidos que se pagan por Mercado Pago quedan confirmados al abonarse. Para encargos grandes y eventos lo conversamos por WhatsApp antes de cerrar la fecha.',
  },
  {
    pregunta: '¿Puedo cambiar mi pedido?',
    respuesta:
      'Escribinos por WhatsApp con el número de tu pedido y lo vemos. Cuanto antes nos avises, más fácil es.',
  },
  {
    pregunta: '¿Cómo funcionan los pedidos para eventos?',
    respuesta:
      'Se cotizan según la ocasión, la cantidad de personas y la fecha. Contanos por WhatsApp o dejanos los datos en «Armá tu ocasión» y te pasamos una propuesta.',
  },
]

/** Campos visuales de "Armá tu ocasión". No es una calculadora. */
export const OCASION_OPCIONES = {
  tipo: [
    'Cumpleaños',
    'Reunión familiar',
    'Evento de trabajo',
    'Merienda compartida',
    'Otra ocasión',
  ],
  personas: ['Hasta 10', '10 a 25', '25 a 50', 'Más de 50'],
  preferencia: ['Dulce', 'Salado', 'Mixto'],
  entrega: ['Retiro en Florida', 'Entrega a domicilio'],
} as const

export function productoPorSlug(slug: string): Producto | undefined {
  return PRODUCTOS.find((p) => p.slug === slug)
}

export function categoriaPorSlug(slug: string): Categoria | undefined {
  return CATEGORIAS.find((c) => c.slug === slug)
}
