import { z } from 'zod'

/**
 * Esquemas de validación en los límites de entrada.
 *
 * Todo dato que venga de un formulario, de una URL o de un webhook pasa por
 * acá antes de tocar la base. Los mensajes están en español porque se muestran
 * tal cual en el panel.
 */

export const Slug = z
  .string()
  .trim()
  .min(2, 'El slug es demasiado corto')
  .max(80, 'El slug es demasiado largo')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Sólo minúsculas, números y guiones simples')

export const Uuid = z.string().uuid('Identificador inválido')

/**
 * Deriva un slug de un nombre.
 *
 * El dueño ya no escribe slugs: se generan de acá y las colisiones se
 * resuelven en el servidor con un sufijo numérico. Si el nombre no deja
 * ningún carácter usable, cae a 'producto'/'categoria' según quien llame.
 */
export function slugificar(texto: string, respaldo = 'producto'): string {
  const slug = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
    .replace(/-+$/, '')
  return slug.length >= 2 ? slug : respaldo
}

/** Teléfono uruguayo o internacional, normalizado a dígitos. */
export const Telefono = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^0-9]/g, ''))
  .refine((v) => v.length >= 6 && v.length <= 20, 'Teléfono inválido')

export const EmailOpcional = z
  .string()
  .trim()
  .email('Email inválido')
  .optional()
  .or(z.literal('').transform(() => undefined))

/** Importe en pesos que se guarda en centésimos. */
export const PrecioPesos = z
  .coerce.number({ message: 'Ingresá un número' })
  .min(0, 'El precio no puede ser negativo')
  .max(99_999_999, 'Precio fuera de rango')
  .transform((v) => Math.round(v * 100))

export const EstadoProducto = z.enum(['draft', 'active', 'archived'])
export const ModalidadVenta = z.enum(['direct', 'preorder', 'quote'])
export const Entrega = z.enum(['pickup', 'delivery', 'both'])
export const EstadoPedido = z.enum([
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
])
export const MetodoPagoPublico = z.enum(['mercado_pago', 'whatsapp'])

// ── Producto ────────────────────────────────────────────────────────────────
export const ProductoEntrada = z
  .object({
    slug: Slug,
    name: z.string().trim().min(2, 'El nombre es obligatorio').max(160),
    categoryId: Uuid.nullable().optional(),
    shortDescription: z.string().trim().max(300).default(''),
    fullDescription: z.string().trim().max(5000).default(''),
    priceCents: PrecioPesos.nullable().optional(),
    status: EstadoProducto.default('draft'),
    saleMode: ModalidadVenta.default('direct'),
    isFeatured: z.coerce.boolean().default(false),
    position: z.coerce.number().int().min(0).max(9999).default(0),
    trackStock: z.coerce.boolean().default(false),
    stockQuantity: z.coerce.number().int().min(0, 'El stock no puede ser negativo').default(0),
    lowStockThreshold: z.coerce.number().int().min(0).default(0),
    leadTimeDays: z.coerce.number().int().min(0).max(365).default(0),
    minQuantity: z.coerce.number().int().min(1, 'La cantidad mínima es 1').default(1),
    fulfillment: Entrega.default('both'),
    seoTitle: z.string().trim().max(120).optional(),
    seoDescription: z.string().trim().max(300).optional(),
  })
  // Un producto de compra directa tiene que poder cobrarse. La misma regla
  // existe como CHECK en la base: acá da un mensaje entendible antes de llegar.
  .refine((p) => p.saleMode !== 'direct' || p.priceCents != null, {
    message: 'Un producto de compra directa necesita precio',
    path: ['priceCents'],
  })

export type ProductoEntradaType = z.infer<typeof ProductoEntrada>

// ── Categoría ───────────────────────────────────────────────────────────────
export const CategoriaEntrada = z.object({
  slug: Slug,
  name: z.string().trim().min(2, 'El nombre es obligatorio').max(120),
  description: z.string().trim().max(600).default(''),
  position: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.coerce.boolean().default(true),
  imageId: Uuid.nullable().optional(),
  seoTitle: z.string().trim().max(120).optional(),
  seoDescription: z.string().trim().max(300).optional(),
})

// ── Medios ──────────────────────────────────────────────────────────────────
const MIME_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'video/mp4',
] as const

export const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024

export const MedioEntrada = z.object({
  path: z.string().trim().min(1).max(400),
  alt: z.string().trim().max(300).default(''),
  mimeType: z.enum(MIME_PERMITIDOS, { message: 'Tipo de archivo no permitido' }),
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional(),
  bytes: z.coerce.number().int().min(0).max(TAMANO_MAXIMO_BYTES, 'El archivo supera 10 MB'),
  source: z.string().trim().max(80).default('own'),
  sourceUrl: z.string().trim().url('URL de origen inválida').optional(),
  credit: z.string().trim().max(200).optional(),
  license: z.string().trim().max(200).optional(),
  isTemporary: z.coerce.boolean().default(false),
})

/** Valida un archivo antes de subirlo, sin depender del navegador. */
export function validarArchivo(archivo: {
  type: string
  size: number
}): { ok: true } | { ok: false; error: string } {
  if (!MIME_PERMITIDOS.includes(archivo.type as (typeof MIME_PERMITIDOS)[number])) {
    return { ok: false, error: 'Formato no permitido. Usá JPG, PNG, WebP, AVIF o MP4.' }
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return { ok: false, error: 'El archivo supera los 10 MB.' }
  }
  return { ok: true }
}

// ── Checkout público ────────────────────────────────────────────────────────
/**
 * Lo único que el comprador puede mandar.
 *
 * No hay campo de precio, ni de total, ni de estado. El servidor los deriva.
 */
export const PedidoPublico = z
  .object({
    customerName: z.string().trim().min(2, 'Ingresá tu nombre').max(120),
    customerPhone: Telefono,
    customerEmail: EmailOpcional,
    fulfillment: Entrega,
    address: z.string().trim().max(300).optional(),
    requestedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')
      .optional(),
    requestedSlot: z.string().trim().max(40).optional(),
    comments: z.string().trim().max(2000).default(''),
    paymentMethod: MetodoPagoPublico,
    items: z
      .array(
        z.object({
          productId: Uuid,
          quantity: z.coerce.number().int().min(1, 'Cantidad inválida').max(999),
        }),
      )
      .min(1, 'El pedido no tiene productos')
      .max(50, 'Demasiados productos en un pedido'),
  })
  .refine((p) => p.fulfillment !== 'delivery' || (p.address && p.address.length > 0), {
    message: 'La entrega a domicilio necesita dirección',
    path: ['address'],
  })

export type PedidoPublicoType = z.infer<typeof PedidoPublico>

// ── Transiciones de estado ──────────────────────────────────────────────────
/**
 * Qué estados siguen a cada estado.
 *
 * Un pedido completado o cancelado es terminal: no vuelve atrás. El resto
 * avanza en orden, y siempre se puede cancelar. Lo que no está acá es
 * incoherente y el panel exige confirmación explícita para forzarlo.
 */
export const TRANSICIONES: Record<
  z.infer<typeof EstadoPedido>,
  z.infer<typeof EstadoPedido>[]
> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export function transicionPermitida(
  desde: z.infer<typeof EstadoPedido>,
  hacia: z.infer<typeof EstadoPedido>,
): boolean {
  return TRANSICIONES[desde].includes(hacia)
}

export function esEstadoTerminal(estado: z.infer<typeof EstadoPedido>): boolean {
  return TRANSICIONES[estado].length === 0
}

/**
 * Prepara un término libre para el filtro `or` de PostgREST.
 *
 * La sintaxis de PostgREST usa coma, paréntesis y comillas como separadores:
 * un término sin limpiar puede inyectar cláusulas extra en el filtro. RLS
 * sigue siendo el límite real de lo que se ve, pero el filtro no debe poder
 * torcerse desde la caja de búsqueda.
 *
 * Estaba resuelto en tres lugares con tres expresiones distintas —una de
 * ellas no quitaba las comillas—. Ahora es una sola.
 */
export function terminoDeBusqueda(crudo: string): string {
  return crudo.replace(/[%,()"'\\*.:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}
