import type { EstadoPago, EstadoPedido, EstadoProducto, ModalidadVenta } from './supabase/tipos'

/** Traducciones de los enums de la base a la interfaz. */
export const ETIQUETA_ESTADO_PEDIDO: Record<EstadoPedido, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  completed: 'Completado',
  cancelled: 'Cancelado',
}

export const ETIQUETA_ESTADO_PAGO: Record<EstadoPago, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

export const ETIQUETA_ESTADO_PRODUCTO: Record<EstadoProducto, string> = {
  draft: 'Borrador',
  active: 'Activo',
  archived: 'Archivado',
}

export const ETIQUETA_MODALIDAD: Record<ModalidadVenta, string> = {
  direct: 'Compra directa',
  preorder: 'Por encargo',
  quote: 'Con cotización',
}

export function tonoEstadoPedido(estado: EstadoPedido) {
  if (estado === 'cancelled') return 'alerta' as const
  if (estado === 'completed') return 'verde' as const
  if (estado === 'pending') return 'caramelo' as const
  return 'neutro' as const
}

export function tonoEstadoPago(estado: EstadoPago) {
  if (estado === 'approved') return 'verde' as const
  if (estado === 'rejected' || estado === 'refunded') return 'alerta' as const
  if (estado === 'pending') return 'caramelo' as const
  return 'neutro' as const
}

/** Fecha corta en formato local. */
export function fechaCorta(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export function fechaHora(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}
