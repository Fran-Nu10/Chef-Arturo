'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
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

/** El carrito arranca con las dos líneas que muestra el prototipo. */
const LINEAS_INICIALES: LineaCarrito[] = [
  { productoSlug: 'pasteleria-01', cantidad: 1 },
  { productoSlug: 'pasteleria-02', cantidad: 1, fecha: 'Fecha elegida' },
]

export function ProveedorPedido({ children }: { children: ReactNode }) {
  const [lineas, setLineas] = useState<LineaCarrito[]>(LINEAS_INICIALES)
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

  const agregar = useCallback(
    (productoSlug: string, cantidad = 1, fechaLinea?: string) => {
      setLineas((prev) => {
        const existente = prev.find((l) => l.productoSlug === productoSlug)
        if (existente) {
          return prev.map((l) =>
            l.productoSlug === productoSlug
              ? {
                  ...l,
                  cantidad: l.cantidad + cantidad,
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
        : prev.map((l) => (l.productoSlug === productoSlug ? { ...l, cantidad } : l)),
    )
  }, [])

  const quitar = useCallback((productoSlug: string) => {
    setLineas((prev) => prev.filter((l) => l.productoSlug !== productoSlug))
  }, [])

  const setDatos = useCallback((parcial: Partial<DatosComprador>) => {
    setDatosRaw((prev) => ({ ...prev, ...parcial }))
  }, [])

  const valor = useMemo<EstadoPedido>(
    () => ({
      lineas,
      cantidad: lineas.reduce((total, l) => total + l.cantidad, 0),
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
      abrirCarrito: () => setCarritoAbierto(true),
      cerrarCarrito: () => setCarritoAbierto(false),
    }),
    [
      lineas,
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
    ],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function usePedido(): EstadoPedido {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('usePedido debe usarse dentro de <ProveedorPedido>')
  return ctx
}
