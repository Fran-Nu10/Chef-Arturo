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
  autoras: 'by Julia y Montserrat',
  ciudad: 'Florida, Uruguay',
  entrega: 'retiro y entrega',
  /** wa.me definitivo pendiente: el enlace no se afirma todavía. */
  whatsapp: '#whatsapp-pendiente',
  ubicacion: 'Ubicación exacta: pendiente de validación.',
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
    nota: 'Vuelve a la vitrina próximamente. Disponibilidad pendiente de validación.',
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
 * Los nombres son estructura de ejemplo, no campañas vigentes: la sección es
 * administrable y admite imagen o video, rango de fechas, CTA y tres estados.
 */
export const CAMPANAS: Campana[] = [
  {
    id: 'campana-activa',
    referencia: 'A·01',
    estado: 'activa',
    titulo: 'Campaña estacional',
    descripcion: 'Contenido pendiente de validación.',
    rango: 'Rango de fechas: pendiente.',
    cta: 'Ver propuesta',
    imagenPendiente: 'Imagen o video temporal',
  },
  {
    id: 'campana-programada',
    referencia: 'A·02',
    estado: 'programada',
    titulo: 'Campaña próxima',
    descripcion: 'Se anuncia al acercarse la fecha.',
    rango: 'Rango de fechas: pendiente.',
    cta: 'Avisame',
    imagenPendiente: 'Imagen temporal',
  },
  {
    id: 'campana-finalizada',
    referencia: 'A·03',
    estado: 'finalizada',
    titulo: 'Campaña anterior',
    descripcion: 'Queda en el archivo de la casa.',
    rango: 'Rango de fechas: finalizado.',
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
    detalle: 'Anticipación por confirmar; puede requerir seña.',
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

/** Todo el contenido aparece como pendiente de validación, según el brief. */
export const PREGUNTAS: Pregunta[] = [
  {
    pregunta: '¿Con cuánta anticipación encargo?',
    respuesta: 'Contenido pendiente de validación.',
  },
  {
    pregunta: '¿Dónde retiro mi pedido?',
    respuesta: 'Contenido pendiente de validación.',
  },
  {
    pregunta: '¿Hacen entregas?',
    respuesta: 'Contenido pendiente de validación.',
  },
  {
    pregunta: '¿Cómo pago?',
    respuesta:
      'Mercado Pago online o coordinación por WhatsApp. Detalle pendiente de validación.',
  },
  {
    pregunta: '¿Cuándo se pide seña?',
    respuesta: 'Contenido pendiente de validación.',
  },
  {
    pregunta: '¿Puedo cambiar mi pedido?',
    respuesta: 'Contenido pendiente de validación.',
  },
  {
    pregunta: '¿Cómo funcionan los pedidos para eventos?',
    respuesta:
      'Se cotizan según ocasión, personas y fecha. Detalle pendiente de validación.',
  },
]

/** Campos visuales de "Armá tu ocasión". No es una calculadora. */
export const OCASION_OPCIONES = {
  tipo: [
    'Cumpleaños',
    'Reunión familiar',
    'Evento de trabajo',
    'Merienda compartida',
    'Otro',
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
