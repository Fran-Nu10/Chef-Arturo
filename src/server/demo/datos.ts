import 'server-only'

import type {
  FilaCategoria,
  FilaCliente,
  FilaHistorialPedido,
  FilaLineaPedido,
  FilaMedia,
  FilaPedido,
  FilaProducto,
  FilaSeccion,
} from '@/lib/supabase/tipos'

/**
 * Datos del panel de demostración.
 *
 * ⚠ TODO LO DE ESTE ARCHIVO ES INVENTADO.
 *
 * Los nombres de producto, los precios, los stocks, los clientes y los pedidos
 * no describen al negocio: existen para que el panel se pueda recorrer y para
 * que los reportes muestren una curva en lugar de ceros. No sirven como
 * catálogo, ni como lista de precios, ni como referencia de nada.
 *
 * Los clientes son personas inventadas. Los teléfonos usan el prefijo 099000
 * —reservado para ejemplos— y los correos, `example.com`. No hay un solo dato
 * de una persona real acá.
 *
 * Sólo se sirve cuando `modoDemo()` da verdadero, o sea cuando no hay ninguna
 * base configurada. Nunca se mezcla con datos reales porque en ese momento no
 * existen datos reales.
 */

// Fecha de referencia fija: hace que la demostración sea reproducible y que
// las capturas no cambien de un día para otro.
const HOY = new Date('2026-08-19T15:00:00.000Z')

const dias = (n: number): string => new Date(HOY.getTime() - n * 86400000).toISOString()

/** Generador determinista: la misma demostración en cada arranque. */
function secuencia(semilla: number): () => number {
  let estado = semilla
  return () => {
    estado = (estado * 1103515245 + 12345) % 2147483648
    return estado / 2147483648
  }
}

const uuid = (prefijo: string, n: number): string =>
  `${prefijo}${String(n).padStart(4, '0')}-0000-4000-8000-000000000000`.slice(0, 36)

// ── Categorías ──────────────────────────────────────────────────────────────

export const CATEGORIAS_DEMO: FilaCategoria[] = [
  {
    id: uuid('c0000000-', 1),
    slug: 'pasteleria',
    name: 'Pastelería',
    description: 'Tortas, tartas y postres por encargo.',
    position: 1,
    is_active: true,
    image_id: null,
    seo_title: null,
    seo_description: null,
    created_at: dias(120),
    updated_at: dias(30),
  },
  {
    id: uuid('c0000000-', 2),
    slug: 'merienda',
    name: 'Merienda',
    description: 'Bizcochos, panificados y cosas de la tarde.',
    position: 2,
    is_active: true,
    image_id: null,
    seo_title: null,
    seo_description: null,
    created_at: dias(120),
    updated_at: dias(45),
  },
  {
    id: uuid('c0000000-', 3),
    slug: 'lunch-eventos',
    name: 'Lunch para eventos',
    description: 'Bandejas y servicio para cumpleaños y reuniones.',
    position: 3,
    is_active: true,
    image_id: null,
    seo_title: null,
    seo_description: null,
    created_at: dias(120),
    updated_at: dias(12),
  },
]

// ── Productos ───────────────────────────────────────────────────────────────

interface SemillaProducto {
  slug: string
  name: string
  categoria: number
  precio: number | null
  modalidad: 'direct' | 'quote'
  estado: 'active' | 'draft' | 'archived'
  stock: number
  controlaStock: boolean
  destacado?: boolean
  minimo?: number
  descripcion: string
}

const SEMILLAS: SemillaProducto[] = [
  { slug: 'torta-chocolate', name: 'Torta de chocolate', categoria: 1, precio: 145000, modalidad: 'direct', estado: 'active', stock: 6, controlaStock: true, destacado: true, descripcion: 'Bizcochuelo de cacao con ganache.' },
  { slug: 'lemon-pie', name: 'Lemon pie', categoria: 1, precio: 118000, modalidad: 'direct', estado: 'active', stock: 4, controlaStock: true, descripcion: 'Masa quebrada, crema de limón y merengue.' },
  { slug: 'torta-personalizada', name: 'Torta personalizada', categoria: 1, precio: null, modalidad: 'quote', estado: 'active', stock: 0, controlaStock: false, minimo: 1, descripcion: 'Diseño a convenir. Se cotiza según tamaño y decoración.' },
  { slug: 'cheesecake-frutos-rojos', name: 'Cheesecake de frutos rojos', categoria: 1, precio: 132000, modalidad: 'direct', estado: 'active', stock: 3, controlaStock: true, destacado: true, descripcion: 'Base de galleta y coulis de frutos rojos.' },
  { slug: 'bizcochos-surtidos', name: 'Bizcochos surtidos (docena)', categoria: 2, precio: 48000, modalidad: 'direct', estado: 'active', stock: 20, controlaStock: true, destacado: true, descripcion: 'Docena mixta de bizcochería.' },
  { slug: 'pan-casero', name: 'Pan casero', categoria: 2, precio: 15000, modalidad: 'direct', estado: 'active', stock: 2, controlaStock: true, descripcion: 'Hogaza de masa madre.' },
  { slug: 'alfajores-maicena', name: 'Alfajores de maicena (6)', categoria: 2, precio: 36000, modalidad: 'direct', estado: 'active', stock: 14, controlaStock: true, descripcion: 'Con dulce de leche y coco.' },
  { slug: 'budin-naranja', name: 'Budín de naranja', categoria: 2, precio: 42000, modalidad: 'direct', estado: 'draft', stock: 0, controlaStock: false, descripcion: 'En preparación: todavía sin publicar.' },
  { slug: 'bandeja-lunch-20', name: 'Bandeja lunch · 20 personas', categoria: 3, precio: 520000, modalidad: 'direct', estado: 'active', stock: 0, controlaStock: false, minimo: 1, descripcion: 'Salados fríos y calientes. Se encarga con 72 h.' },
  { slug: 'lunch-a-medida', name: 'Lunch a medida', categoria: 3, precio: null, modalidad: 'quote', estado: 'active', stock: 0, controlaStock: false, descripcion: 'Se arma según cantidad de invitados y horario.' },
  { slug: 'mesa-dulce', name: 'Mesa dulce para evento', categoria: 3, precio: null, modalidad: 'quote', estado: 'active', stock: 0, controlaStock: false, descripcion: 'Variedad de miniaturas. Se cotiza por persona.' },
  { slug: 'rosca-pascua', name: 'Rosca de Pascua', categoria: 1, precio: 95000, modalidad: 'direct', estado: 'archived', stock: 0, controlaStock: false, descripcion: 'De temporada. Archivada fuera de fecha.' },
]

export const PRODUCTOS_DEMO: FilaProducto[] = SEMILLAS.map((s, i) => ({
  id: uuid('a0000000-', i + 1),
  slug: s.slug,
  name: s.name,
  category_id: CATEGORIAS_DEMO[s.categoria - 1].id,
  short_description: s.descripcion,
  full_description: s.descripcion,
  price_cents: s.precio,
  currency: 'UYU',
  status: s.estado,
  sale_mode: s.modalidad,
  is_featured: s.destacado ?? false,
  position: i + 1,
  track_stock: s.controlaStock,
  stock_quantity: s.stock,
  low_stock_threshold: s.controlaStock ? 3 : 0,
  lead_time_days: s.categoria === 3 ? 3 : 1,
  min_quantity: s.minimo ?? 1,
  fulfillment: 'both',
  seo_title: null,
  seo_description: null,
  created_at: dias(120 - i * 3),
  updated_at: dias(20 - (i % 15)),
  archived_at: s.estado === 'archived' ? dias(60) : null,
}))

// ── Clientes ────────────────────────────────────────────────────────────────

const NOMBRES = [
  'Valentina Ríos',
  'Martín Cabrera',
  'Lucía Ferreira',
  'Diego Sosa',
  'Camila Núñez',
  'Andrés Píriz',
  'Sofía Machado',
  'Rodrigo Olivera',
]

export const CLIENTES_DEMO: FilaCliente[] = NOMBRES.map((nombre, i) => ({
  id: uuid('b0000000-', i + 1),
  name: nombre,
  // 099000xxx es un rango de ejemplo, no un teléfono en servicio.
  phone: `099000${String(100 + i)}`,
  email: `cliente${i + 1}@example.com`,
  internal_notes: i === 2 ? 'Demostración: acá van las notas privadas del cliente.' : '',
  first_order_at: dias(90 - i * 5),
  last_order_at: dias(i * 3 + 1),
  created_at: dias(90 - i * 5),
  updated_at: dias(i * 3 + 1),
}))

// ── Pedidos ─────────────────────────────────────────────────────────────────

const VENDIBLES = PRODUCTOS_DEMO.filter((p) => p.status === 'active' && p.price_cents !== null)

type Estado = FilaPedido['status']
type EstadoPago = FilaPedido['payment_status']

/** Combinaciones coherentes: no hay un pedido entregado sin pago resuelto. */
const CAMINOS: Array<{ estado: Estado; pago: EstadoPago; peso: number }> = [
  { estado: 'completed', pago: 'approved', peso: 46 },
  { estado: 'ready', pago: 'approved', peso: 12 },
  { estado: 'preparing', pago: 'approved', peso: 10 },
  { estado: 'confirmed', pago: 'approved', peso: 8 },
  { estado: 'pending', pago: 'pending', peso: 14 },
  { estado: 'cancelled', pago: 'cancelled', peso: 7 },
  { estado: 'completed', pago: 'refunded', peso: 3 },
]

const TOTAL_PESOS = CAMINOS.reduce((s, c) => s + c.peso, 0)

function caminoPara(r: number) {
  let acumulado = 0
  const objetivo = r * TOTAL_PESOS
  for (const c of CAMINOS) {
    acumulado += c.peso
    if (objetivo <= acumulado) return c
  }
  return CAMINOS[0]
}

const azar = secuencia(20260819)

interface PedidoArmado {
  pedido: FilaPedido
  lineas: FilaLineaPedido[]
}

const ARMADOS: PedidoArmado[] = Array.from({ length: 42 }, (_, i) => {
  const antiguedad = Math.floor(azar() * 44)
  const cliente = CLIENTES_DEMO[Math.floor(azar() * CLIENTES_DEMO.length)]
  const camino = caminoPara(azar())
  const cantidadLineas = 1 + Math.floor(azar() * 3)

  const lineas: FilaLineaPedido[] = Array.from({ length: cantidadLineas }, (_, j) => {
    const producto = VENDIBLES[Math.floor(azar() * VENDIBLES.length)]
    const cantidad = 1 + Math.floor(azar() * 2)
    const unitario = producto.price_cents ?? 0
    return {
      id: uuid('d0000000-', i * 10 + j + 1),
      order_id: uuid('e0000000-', i + 1),
      product_id: producto.id,
      product_name: producto.name,
      product_slug: producto.slug,
      unit_price_cents: unitario,
      quantity: cantidad,
      line_total_cents: unitario * cantidad,
      sale_mode: producto.sale_mode,
      options: {},
      created_at: dias(antiguedad),
    }
  })

  const subtotal = lineas.reduce((s, l) => s + l.line_total_cents, 0)
  const entrega: FilaPedido['fulfillment'] = azar() > 0.6 ? 'delivery' : 'pickup'
  const envio = entrega === 'delivery' ? 12000 : 0

  return {
    pedido: {
      id: uuid('e0000000-', i + 1),
      order_number: `CA-${1000 + i}`,
      customer_id: cliente.id,
      status: camino.estado,
      payment_status: camino.pago,
      payment_method: (azar() > 0.45 ? 'mercado_pago' : 'whatsapp') as FilaPedido['payment_method'],
      subtotal_cents: subtotal,
      shipping_cents: envio,
      discount_cents: 0,
      total_cents: subtotal + envio,
      currency: 'UYU',
      requested_date: dias(antiguedad - 2).slice(0, 10),
      requested_slot: azar() > 0.5 ? 'Tarde (15 a 18)' : 'Mañana (9 a 12)',
      fulfillment: entrega,
      address: entrega === 'delivery' ? 'Dirección de ejemplo 1234, Florida' : null,
      customer_comments: i % 7 === 0 ? 'Sin nueces, por favor.' : '',
      internal_notes: i % 11 === 0 ? 'Demostración: nota interna del pedido.' : '',
      created_at: dias(antiguedad),
      updated_at: dias(Math.max(antiguedad - 1, 0)),
      cancelled_at: camino.estado === 'cancelled' ? dias(Math.max(antiguedad - 1, 0)) : null,
    },
    lineas,
  }
}).sort((a, b) => b.pedido.created_at.localeCompare(a.pedido.created_at))

export const PEDIDOS_DEMO: FilaPedido[] = ARMADOS.map((a) => a.pedido)
export const LINEAS_DEMO: FilaLineaPedido[] = ARMADOS.flatMap((a) => a.lineas)

export const HISTORIAL_DEMO: FilaHistorialPedido[] = PEDIDOS_DEMO.flatMap((p, i) => {
  const base: FilaHistorialPedido = {
    id: uuid('f0000000-', i * 2 + 1),
    order_id: p.id,
    from_status: null,
    to_status: 'pending',
    note: 'Pedido recibido desde la tienda.',
    changed_by: null,
    created_at: p.created_at,
  }
  if (p.status === 'pending') return [base]
  return [
    base,
    {
      id: uuid('f0000000-', i * 2 + 2),
      order_id: p.id,
      from_status: 'pending' as const,
      to_status: p.status,
      note: '',
      changed_by: null,
      created_at: p.updated_at,
    },
  ]
})

// ── Medios ──────────────────────────────────────────────────────────────────

// Apuntan a fotos que existen en `public/fotos`: en demostración no hay
// Storage y una ruta inventada daría 404 en cada miniatura.
export const MEDIOS_DEMO: FilaMedia[] = [
  'pasteleria1.jpg',
  'pasteleria2.jpg',
  'merienda1.jpg',
  'luncheventos1.jpg',
  'LamesadeChefArturo2.jpg',
].map((archivo, i) => ({
  id: uuid('90000000-', i + 1),
  bucket: 'media',
  path: `fotos/${archivo}`,
  alt: 'Fotografía de demostración.',
  width: 1600,
  height: 1200,
  mime_type: 'image/jpeg',
  bytes: 480000,
  source: 'demo',
  source_url: null,
  credit: null,
  license: null,
  is_temporary: true,
  created_at: dias(40 - i),
  updated_at: dias(40 - i),
}))

// ── Contenido ───────────────────────────────────────────────────────────────

const CONTENIDO: Record<string, Record<string, unknown>> = {
  hero: {
    kicker: 'Florida, Uruguay',
    titulo: 'La vitrina de Chef Arturo',
    bajada: 'Pastelería, merienda y lunch para eventos.',
    ctaPrimario: { etiqueta: 'Ver el catálogo', destino: '/catalogo' },
    ctaSecundario: { etiqueta: 'Escribinos', destino: 'whatsapp' },
    media: { mediaId: '', alt: '' },
    videoPendiente: true,
  },
  categorias: { numero: '01', kicker: 'Qué hacemos', titulo: 'Tres formas de encontrarnos' },
  mostrador: { numero: '02', kicker: 'Hoy', titulo: 'Del mostrador de hoy' },
  'detalle-final': {
    numero: '03',
    kicker: 'El oficio',
    titulo: 'El detalle final',
    frases: ['Se amasa temprano.', 'Se hornea a la vista.', 'Se entrega en el día.'],
    media: { mediaId: '', alt: '' },
    videoPendiente: true,
  },
  'arma-tu-evento': {
    numero: '04',
    kicker: 'Eventos',
    titulo: 'Armá tu ocasión',
    bajada: 'Contanos cuántos son y para cuándo.',
    media: { mediaId: '', alt: '' },
  },
  'fechas-importantes': {
    numero: '05',
    kicker: 'Calendario',
    titulo: 'Fechas importantes',
    bajada: 'Las que conviene encargar con tiempo.',
  },
  'formas-de-pedir': { numero: '06', kicker: 'Cómo', titulo: 'Formas de pedir' },
  'la-mesa': {
    numero: '07',
    kicker: 'Comunidad',
    titulo: 'La mesa de Chef Arturo',
    enlaceInstagram: { etiqueta: 'Seguinos', destino: 'whatsapp' },
  },
  'cta-final': {
    kicker: 'Empecemos',
    titulo: '¿Lo tuyo es dulce o salado?',
    ctaPrimario: { etiqueta: 'Ver el catálogo', destino: '/catalogo' },
    ctaSecundario: { etiqueta: 'Pedir por WhatsApp', destino: 'whatsapp' },
    nota: 'Contenido de demostración.',
    media: { mediaId: '', alt: '' },
  },
  footer: { leyenda: 'Contenido de demostración.', mostrarUbicacion: true },
}

export const SECCIONES_DEMO: FilaSeccion[] = Object.entries(CONTENIDO).map(
  ([clave, valor], i) => ({
    id: uuid('80000000-', i + 1),
    key: clave,
    is_enabled: true,
    position: i + 1,
    draft: valor,
    // Todas publicadas menos una, para que se vea la diferencia entre
    // borrador y publicado en el editor.
    published: clave === 'fechas-importantes' ? null : valor,
    media_ids: [],
    published_at: clave === 'fechas-importantes' ? null : dias(15),
    updated_at: dias(15),
  }),
)

// ── Búsquedas ───────────────────────────────────────────────────────────────

export function clienteDemoPorId(id: string): FilaCliente | null {
  return CLIENTES_DEMO.find((c) => c.id === id) ?? null
}

export function productoDemoPorId(id: string): FilaProducto | null {
  return PRODUCTOS_DEMO.find((p) => p.id === id) ?? null
}

export function pedidoDemoPorId(id: string): FilaPedido | null {
  return PEDIDOS_DEMO.find((p) => p.id === id) ?? null
}

/** Filtro de texto sencillo, equivalente al `ilike` del modo real. */
export function coincide(texto: string, termino: string): boolean {
  return texto.toLocaleLowerCase('es').includes(termino.toLocaleLowerCase('es'))
}
