'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { LineaCarrito } from '@/content/tipos'

/**
 * Estado del pedido: carrito + selecciones de checkout.
 *
 * Viven juntos a propósito — un error de pago recuperable no puede destruir ni
 * el carrito ni la fecha elegida (Especificación § 2, "PasosCheckout").
 */
export type Entrega = 'retiro' | 'domicilio'
export type Franja = 'manana' | 'tarde'

export interface DatosComprador {
  nombre: string
  telefono: string
  email: string
  nota: string
}

interface EstadoPedido {
  lineas: LineaCarrito[]
  cantidad: number
  /**
   * `false` hasta leer lo guardado. La interfaz muestra un esqueleto mientras
   * tanto en vez de un carrito vacío que después cambia de golpe.
   */
  hidratado: boolean
  agregar: (productoSlug: string, cantidad?: number, fecha?: string) => void
  cambiarCantidad: (productoSlug: string, cantidad: number) => void
  quitar: (productoSlug: string) => void
  vaciar: () => void

  entrega: Entrega | null
  setEntrega: (v: Entrega) => void
  direccion: string
  setDireccion: (v: string) => void

  fecha: string
  setFecha: (v: string) => void
  franja: Franja | null
  setFranja: (v: Franja) => void

  datos: DatosComprador
  setDatos: (v: Partial<DatosComprador>) => void

  carritoAbierto: boolean
  abrirCarrito: () => void
  cerrarCarrito: () => void
}

const Contexto = createContext<EstadoPedido | null>(null)

// ── Persistencia ────────────────────────────────────────────────────────────

const CLAVE = 'chef_arturo_pedido'
const VERSION = 1

interface Guardado {
  v: number
  lineas: LineaCarrito[]
}

/**
 * Normaliza una línea venga de donde venga.
 *
 * Es deliberadamente tolerante: lo guardado puede ser de una versión anterior,
 * de otra pestaña o de una estructura que ya no existe. Una línea que no se
 * entiende se descarta sola; el resto del carrito sobrevive. **Nunca se vacía
 * el carrito entero por no reconocer una línea.**
 */
function normalizarLinea(cruda: unknown): LineaCarrito | null {
  if (!cruda || typeof cruda !== 'object') return null
  const l = cruda as Record<string, unknown>

  // `productoSlug` es el nombre actual; `slug` y `producto` cubren formas
  // anteriores del prototipo por si quedó algo guardado en un navegador.
  const slug = [l.productoSlug, l.slug, l.producto].find(
    (v): v is string => typeof v === 'string' && v.length > 0,
  )
  if (!slug) return null

  const cantidadCruda = Number(l.cantidad ?? 1)
  const cantidad =
    Number.isFinite(cantidadCruda) && cantidadCruda > 0
      ? Math.min(Math.floor(cantidadCruda), 99)
      : 1

  const fecha = typeof l.fecha === 'string' && l.fecha ? l.fecha : undefined
  return { productoSlug: slug, cantidad, fecha }
}

/** Lee el carrito guardado. Cualquier problema devuelve un carrito vacío. */
function leerGuardado(): LineaCarrito[] {
  if (typeof window === 'undefined') return []
  try {
    const crudo = window.localStorage.getItem(CLAVE)
    if (!crudo) return []
    const dato = JSON.parse(crudo) as unknown

    // Formato actual: { v, lineas }. Antes de versionar se guardaba el array
    // pelado, así que también se acepta — migrar no puede costarle el carrito
    // a nadie.
    const lineas = Array.isArray(dato)
      ? dato
      : Array.isArray((dato as Guardado)?.lineas)
        ? (dato as Guardado).lineas
        : []

    const normalizadas = lineas
      .map(normalizarLinea)
      .filter((l): l is LineaCarrito => l !== null)

    // Una misma línea repetida —posible en datos viejos— se suma en vez de
    // duplicarse.
    const porSlug = new Map<string, LineaCarrito>()
    for (const l of normalizadas) {
      const previa = porSlug.get(l.productoSlug)
      porSlug.set(
        l.productoSlug,
        previa
          ? { ...previa, cantidad: Math.min(previa.cantidad + l.cantidad, 99) }
          : l,
      )
    }
    return [...porSlug.values()]
  } catch {
    // Modo privado de Safari, cuota llena, JSON corrupto. Sin carrito, pero
    // sin romper la tienda.
    return []
  }
}

export function ProveedorPedido({ children }: { children: ReactNode }) {
  // Arranca vacío en el servidor y en el primer render del cliente: cualquier
  // otra cosa produce un desajuste de hidratación. Lo guardado se aplica en el
  // efecto de abajo.
  const [lineas, setLineas] = useState<LineaCarrito[]>([])
  const [hidratado, setHidratado] = useState(false)
  const [entrega, setEntrega] = useState<Entrega | null>('retiro')
  const [direccion, setDireccion] = useState('')
  const [fecha, setFecha] = useState('')
  const [franja, setFranja] = useState<Franja | null>(null)
  const [datos, setDatosRaw] = useState<DatosComprador>({
    nombre: '',
    telefono: '',
    email: '',
    nota: '',
  })
  const [carritoAbierto, setCarritoAbierto] = useState(false)

  useEffect(() => {
    setLineas(leerGuardado())
    setHidratado(true)
  }, [])

  // Guardar sólo después de hidratar: si no, el primer render vacío pisaría el
  // carrito que la persona ya tenía.
  const guardado = useRef(false)
  useEffect(() => {
    if (!hidratado) return
    guardado.current = true
    try {
      window.localStorage.setItem(CLAVE, JSON.stringify({ v: VERSION, lineas }))
    } catch {
      // Sin espacio o sin permiso. El carrito sigue funcionando en memoria.
    }
  }, [lineas, hidratado])

  const agregar = useCallback(
    (productoSlug: string, cantidad = 1, fechaLinea?: string) => {
      setLineas((prev) => {
        const existente = prev.find((l) => l.productoSlug === productoSlug)
        if (existente) {
          return prev.map((l) =>
            l.productoSlug === productoSlug
              ? {
                  ...l,
                  cantidad: Math.min(l.cantidad + cantidad, 99),
                  fecha: fechaLinea ?? l.fecha,
                }
              : l,
          )
        }
        return [...prev, { productoSlug, cantidad, fecha: fechaLinea }]
      })
    },
    [],
  )

  const cambiarCantidad = useCallback((productoSlug: string, cantidad: number) => {
    setLineas((prev) =>
      cantidad <= 0
        ? prev.filter((l) => l.productoSlug !== productoSlug)
        : prev.map((l) =>
            l.productoSlug === productoSlug
              ? { ...l, cantidad: Math.min(cantidad, 99) }
              : l,
          ),
    )
  }, [])

  const quitar = useCallback((productoSlug: string) => {
    setLineas((prev) => prev.filter((l) => l.productoSlug !== productoSlug))
  }, [])

  const setDatos = useCallback((parcial: Partial<DatosComprador>) => {
    setDatosRaw((prev) => ({ ...prev, ...parcial }))
  }, [])

  const abrirCarrito = useCallback(() => setCarritoAbierto(true), [])
  const cerrarCarrito = useCallback(() => setCarritoAbierto(false), [])

  const valor = useMemo<EstadoPedido>(
    () => ({
      lineas,
      cantidad: lineas.reduce((total, l) => total + l.cantidad, 0),
      hidratado,
      agregar,
      cambiarCantidad,
      quitar,
      vaciar: () => setLineas([]),
      entrega,
      setEntrega,
      direccion,
      setDireccion,
      fecha,
      setFecha,
      franja,
      setFranja,
      datos,
      setDatos,
      carritoAbierto,
      abrirCarrito,
      cerrarCarrito,
    }),
    [
      lineas,
      hidratado,
      agregar,
      cambiarCantidad,
      quitar,
      entrega,
      direccion,
      fecha,
      franja,
      datos,
      setDatos,
      carritoAbierto,
      abrirCarrito,
      cerrarCarrito,
    ],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function usePedido(): EstadoPedido {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('usePedido debe usarse dentro de <ProveedorPedido>')
  return ctx
}
