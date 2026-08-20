export interface ItemNav {
  href: string
  etiqueta: string
  exacto?: boolean
  soloOwner?: boolean
}

export const NAVEGACION: ItemNav[] = [
  { href: '/admin', etiqueta: 'Resumen', exacto: true },
  { href: '/admin/pedidos', etiqueta: 'Pedidos' },
  { href: '/admin/productos', etiqueta: 'Productos' },
  { href: '/admin/categorias', etiqueta: 'Categorías' },
  { href: '/admin/contenido', etiqueta: 'Contenido' },
  { href: '/admin/medios', etiqueta: 'Medios' },
  { href: '/admin/clientes', etiqueta: 'Clientes' },
  { href: '/admin/reportes', etiqueta: 'Reportes' },
  { href: '/admin/ajustes', etiqueta: 'Ajustes', soloOwner: true },
]

export function esRutaActiva(
  ruta: string,
  item: Pick<ItemNav, 'href' | 'exacto'>,
): boolean {
  if (item.exacto) return ruta === item.href
  return ruta === item.href || ruta.startsWith(`${item.href}/`)
}
