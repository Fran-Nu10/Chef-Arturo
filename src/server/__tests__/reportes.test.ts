import { describe, expect, it } from 'vitest'
import { METRICAS_VACIAS, calcularMetricas } from '../reportes/repositorio'

type Pedido = Parameters<typeof calcularMetricas>[0][number]
type Linea = Parameters<typeof calcularMetricas>[1][number]

const pedido = (p: Partial<Pedido> & { id: string }): Pedido => ({
  total_cents: 100000,
  status: 'completed',
  payment_status: 'approved',
  payment_method: 'mercado_pago',
  created_at: '2026-03-10T12:00:00.000Z',
  ...p,
})

describe('calcularMetricas', () => {
  it('sin pedidos devuelve todo en cero', () => {
    const m = calcularMetricas([], [])
    expect(m.ingresosAprobadosCents).toBe(0)
    expect(m.facturacionBrutaCents).toBe(0)
    expect(m.ticketPromedioCents).toBe(0)
    expect(m.cantidadPedidos).toBe(0)
    expect(m.productosMasVendidos).toEqual([])
    expect(m).toEqual({ ...METRICAS_VACIAS, evolucion: [] })
  })

  it('separa facturación bruta de ingresos aprobados', () => {
    const m = calcularMetricas(
      [
        pedido({ id: '1', payment_status: 'approved', total_cents: 100000 }),
        pedido({ id: '2', payment_status: 'pending', total_cents: 50000 }),
        pedido({ id: '3', payment_status: 'rejected', total_cents: 30000 }),
      ],
      [],
    )
    // Bruta suma todo lo pedido; aprobados sólo lo cobrado.
    expect(m.facturacionBrutaCents).toBe(180000)
    expect(m.ingresosAprobadosCents).toBe(100000)
    expect(m.pagosPendientesCents).toBe(50000)
  })

  it('no cuenta los pedidos cancelados como venta', () => {
    const m = calcularMetricas(
      [
        pedido({ id: '1', total_cents: 100000 }),
        pedido({
          id: '2',
          status: 'cancelled',
          payment_status: 'cancelled',
          total_cents: 90000,
        }),
      ],
      [],
    )
    expect(m.ingresosAprobadosCents).toBe(100000)
    expect(m.canceladosCents).toBe(90000)
    expect(m.cantidadCancelados).toBe(1)
  })

  it('cuenta los reembolsos aparte y fuera de los ingresos', () => {
    const m = calcularMetricas(
      [
        pedido({ id: '1', total_cents: 100000 }),
        pedido({ id: '2', payment_status: 'refunded', total_cents: 40000 }),
      ],
      [],
    )
    expect(m.ingresosAprobadosCents).toBe(100000)
    expect(m.reembolsosCents).toBe(40000)
  })

  it('calcula el ticket promedio sólo sobre pedidos pagados', () => {
    const m = calcularMetricas(
      [
        pedido({ id: '1', total_cents: 100000 }),
        pedido({ id: '2', total_cents: 200000 }),
        pedido({ id: '3', payment_status: 'pending', total_cents: 999999 }),
      ],
      [],
    )
    expect(m.ticketPromedioCents).toBe(150000)
  })

  it('agrupa por método de pago sólo lo aprobado', () => {
    const m = calcularMetricas(
      [
        pedido({ id: '1', payment_method: 'mercado_pago', total_cents: 100000 }),
        pedido({ id: '2', payment_method: 'whatsapp', total_cents: 60000 }),
        pedido({
          id: '3',
          payment_method: 'whatsapp',
          payment_status: 'pending',
          total_cents: 500000,
        }),
      ],
      [],
    )
    const wa = m.porMetodoPago.find((x) => x.metodo === 'whatsapp')
    expect(wa?.totalCents).toBe(60000)
    expect(wa?.cantidad).toBe(1)
  })

  it('excluye del top de productos las líneas de pedidos cancelados', () => {
    const lineas: Linea[] = [
      { order_id: '1', product_name: 'Torta', quantity: 2, line_total_cents: 100000 },
      { order_id: '2', product_name: 'Torta', quantity: 8, line_total_cents: 400000 },
    ]
    const m = calcularMetricas(
      [pedido({ id: '1' }), pedido({ id: '2', status: 'cancelled' })],
      lineas,
    )
    expect(m.productosMasVendidos).toEqual([
      { nombre: 'Torta', unidades: 2, totalCents: 100000 },
    ])
  })

  it('ordena el top por unidades y lo corta en diez', () => {
    const lineas: Linea[] = Array.from({ length: 15 }, (_, i) => ({
      order_id: '1',
      product_name: `P${i}`,
      quantity: i + 1,
      line_total_cents: 1000,
    }))
    const m = calcularMetricas([pedido({ id: '1' })], lineas)
    expect(m.productosMasVendidos).toHaveLength(10)
    expect(m.productosMasVendidos[0].nombre).toBe('P14')
  })

  it('agrupa por día en rangos cortos y por mes en largos', () => {
    const pedidos = [
      pedido({ id: '1', created_at: '2026-03-10T10:00:00.000Z' }),
      pedido({ id: '2', created_at: '2026-03-10T20:00:00.000Z' }),
      pedido({ id: '3', created_at: '2026-04-02T10:00:00.000Z' }),
    ]
    const porDia = calcularMetricas(pedidos, [], { porMes: false })
    expect(porDia.evolucion.map((e) => e.periodo)).toEqual(['2026-03-10', '2026-04-02'])
    expect(porDia.evolucion[0].pedidos).toBe(2)

    const porMes = calcularMetricas(pedidos, [], { porMes: true })
    expect(porMes.evolucion.map((e) => e.periodo)).toEqual(['2026-03', '2026-04'])
  })

  it('en la evolución sólo suma ingresos de pagos aprobados', () => {
    const m = calcularMetricas(
      [
        pedido({ id: '1', created_at: '2026-03-10T10:00:00.000Z', total_cents: 100000 }),
        pedido({
          id: '2',
          created_at: '2026-03-10T11:00:00.000Z',
          payment_status: 'pending',
          total_cents: 700000,
        }),
      ],
      [],
    )
    expect(m.evolucion[0].pedidos).toBe(2)
    expect(m.evolucion[0].ingresosCents).toBe(100000)
  })
})
