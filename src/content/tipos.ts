/**
 * Modelo de contenido — Chef Arturo · La Vitrina.
 *
 * El contenido está separado del diseño: productos, campañas, FAQ y galería son
 * colecciones. Nada de esto afirma precios, tiempos, zonas ni políticas: los
 * valores por defecto son los placeholders del prototipo, pendientes de validación.
 */

/** Las tres modalidades de compra. No se fuerzan dentro de una ficha idéntica. */
export type Modalidad = 'directa' | 'encargo' | 'consultar'

/** Disponibilidad del producto en la vitrina de hoy. */
export type Disponibilidad =
  | 'disponible'
  | 'agotado' // agotado hoy, vuelve
  | 'no-disponible' // fuera de la vitrina
  | 'requiere-fecha' // sólo se sirve contra una fecha elegida

export type CategoriaSlug = 'pasteleria' | 'merienda' | 'lunch'

export interface Categoria {
  slug: CategoriaSlug
  nombre: string
  numero: string
  /** Copy comercial de la sección "Elegí tu ocasión". */
  descripcion: string
  cta: string
  /** Texto del placeholder de imagen mientras no haya foto real. */
  imagenPendiente: string
}

export interface Producto {
  slug: string
  nombre: string
  categoria: CategoriaSlug
  modalidad: Modalidad
  disponibilidad: Disponibilidad
  /** Nunca un número: el precio está pendiente de validación. */
  precio: string
  /** Nota de estado bajo el nombre (anticipación, agotado, para eventos…). */
  nota?: string
  imagenPendiente: string
}

export type EstadoCampana = 'activa' | 'programada' | 'finalizada'

export interface Campana {
  id: string
  referencia: string
  estado: EstadoCampana
  titulo: string
  descripcion: string
  rango: string
  cta?: string
  imagenPendiente: string
}

export interface ItemGaleria {
  id: string
  tipo: 'foto' | 'video'
  orientacion: 'vertical' | 'horizontal'
  alt: string
}

export interface Pregunta {
  pregunta: string
  respuesta: string
}

export interface PasoPedido {
  numero: string
  titulo: string
  detalle: string
}

export interface LineaCarrito {
  productoSlug: string
  cantidad: number
  /** Fecha elegida para los ítems por encargo. Pendiente de validación. */
  fecha?: string
}
