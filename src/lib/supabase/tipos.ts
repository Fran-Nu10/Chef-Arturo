/**
 * Tipos de la base.
 *
 * Las filas se declaran como alias de tipo y no como interfaces: postgrest-js
 * exige que cada `Row` satisfaga `Record<string, unknown>`, y sólo los alias
 * tienen la firma de índice implícita que hace falta. Con `interface`, el
 * cliente degrada silenciosamente a `never` y se pierde todo el tipado.
 *
 * Escritos a mano y en paralelo a las migraciones. Cuando exista un proyecto
 * Supabase real conviene regenerarlos:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/tipos.ts
 */

export type RolAdmin = 'owner' | 'staff'
export type EstadoProducto = 'draft' | 'active' | 'archived'
export type ModalidadVenta = 'direct' | 'preorder' | 'quote'
export type Entrega = 'pickup' | 'delivery' | 'both'
export type EstadoPedido =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
export type EstadoPago = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'refunded'
export type MetodoPago = 'mercado_pago' | 'whatsapp' | 'cash'

export type FilaAdmin = {
  id: string
  role: RolAdmin
  is_active: boolean
  display_name: string | null
  created_at: string
  updated_at: string
}

export type FilaMedia = {
  id: string
  bucket: string
  path: string
  alt: string
  width: number | null
  height: number | null
  mime_type: string
  bytes: number | null
  source: string
  source_url: string | null
  credit: string | null
  license: string | null
  is_temporary: boolean
  created_at: string
  updated_at: string
}

export type FilaCategoria = {
  id: string
  slug: string
  name: string
  description: string
  position: number
  is_active: boolean
  image_id: string | null
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export type FilaProducto = {
  id: string
  slug: string
  name: string
  category_id: string | null
  short_description: string
  full_description: string
  price_cents: number | null
  currency: string
  status: EstadoProducto
  sale_mode: ModalidadVenta
  is_featured: boolean
  position: number
  track_stock: boolean
  stock_quantity: number
  low_stock_threshold: number
  lead_time_days: number
  min_quantity: number
  fulfillment: Entrega
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
}

export type FilaImagenProducto = {
  id: string
  product_id: string
  media_id: string
  alt: string
  position: number
  is_primary: boolean
  created_at: string
}

export type FilaSeccion = {
  id: string
  key: string
  is_enabled: boolean
  position: number
  draft: Record<string, unknown>
  published: Record<string, unknown> | null
  media_ids: string[]
  published_at: string | null
  updated_at: string
}

export type FilaCliente = {
  id: string
  name: string
  phone: string
  email: string | null
  internal_notes: string
  first_order_at: string | null
  last_order_at: string | null
  created_at: string
  updated_at: string
}

export type FilaPedido = {
  id: string
  order_number: string
  customer_id: string
  status: EstadoPedido
  payment_status: EstadoPago
  payment_method: MetodoPago | null
  subtotal_cents: number
  shipping_cents: number
  discount_cents: number
  total_cents: number
  currency: string
  requested_date: string | null
  requested_slot: string | null
  fulfillment: Entrega
  address: string | null
  customer_comments: string
  internal_notes: string
  created_at: string
  updated_at: string
  cancelled_at: string | null
}

export type FilaLineaPedido = {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_slug: string
  unit_price_cents: number
  quantity: number
  line_total_cents: number
  sale_mode: ModalidadVenta
  options: Record<string, unknown>
  created_at: string
}

export type FilaHistorialPedido = {
  id: string
  order_id: string
  from_status: EstadoPedido | null
  to_status: EstadoPedido
  note: string
  changed_by: string | null
  created_at: string
}

export type FilaPago = {
  id: string
  order_id: string
  method: MetodoPago
  status: EstadoPago
  amount_cents: number
  currency: string
  provider_preference_id: string | null
  provider_payment_id: string | null
  provider_payload: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

type Tabla<F, I = Partial<F>, U = Partial<F>> = {
  Row: F
  Insert: I
  Update: U
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      admin_users: Tabla<FilaAdmin>
      media_assets: Tabla<FilaMedia>
      categories: Tabla<FilaCategoria>
      products: Tabla<FilaProducto>
      product_images: Tabla<FilaImagenProducto>
      site_sections: Tabla<FilaSeccion>
      site_settings: Tabla<{ key: string; value: Record<string, unknown>; updated_at: string }>
      customers: Tabla<FilaCliente>
      orders: Tabla<FilaPedido>
      order_items: Tabla<FilaLineaPedido>
      order_status_history: Tabla<FilaHistorialPedido>
      payments: Tabla<FilaPago>
    }
    Views: Record<string, never>
    Functions: {
      create_public_order: {
        Args: {
          p_customer_name: string
          p_customer_phone: string
          p_customer_email: string | null
          p_fulfillment: Entrega
          p_address: string | null
          p_requested_date: string | null
          p_requested_slot: string | null
          p_comments: string
          p_payment_method: MetodoPago
          p_items: { product_id: string; quantity: number }[]
        }
        Returns: { order_id: string; order_number: string; total_cents: number }[]
      }
      is_active_admin: { Args: Record<string, never>; Returns: boolean }
      admin_role: { Args: Record<string, never>; Returns: RolAdmin }
      is_owner: { Args: Record<string, never>; Returns: boolean }
      media_asset_usage: {
        Args: { p_media_id: string }
        Returns: { usage_kind: string; usage_id: string; usage_label: string }[]
      }
    }
    CompositeTypes: Record<string, never>
    Enums: {
      admin_role: RolAdmin
      product_status: EstadoProducto
      sale_mode: ModalidadVenta
      fulfillment_mode: Entrega
      order_status: EstadoPedido
      payment_status: EstadoPago
      payment_method: MetodoPago
    }
  }
}
