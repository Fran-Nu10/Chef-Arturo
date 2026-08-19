import type { ReactNode } from 'react'

/**
 * Tabla responsive.
 *
 * En desktop es una tabla real —con `th` y `scope`, para que un lector de
 * pantalla la anuncie bien—. Por debajo de `lg` cada fila se apila en tarjeta
 * y cada celda lleva su etiqueta, en vez de forzar un scroll horizontal.
 */
export interface Columna<T> {
  clave: string
  etiqueta: string
  render: (fila: T) => ReactNode
  /** Se oculta en mobile por ser secundaria. */
  secundaria?: boolean
  alineacion?: 'izquierda' | 'derecha'
}

export function Tabla<T>({
  columnas,
  filas,
  claveFila,
  vacio,
}: {
  columnas: Columna<T>[]
  filas: T[]
  claveFila: (fila: T) => string
  vacio: ReactNode
}) {
  if (filas.length === 0) return <>{vacio}</>

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr className="border-b border-linea">
              {columnas.map((c) => (
                <th
                  key={c.clave}
                  scope="col"
                  className={`px-3 py-2.5 text-[11px] font-semibold tracking-[0.08em] text-tinta-suave uppercase ${
                    c.alineacion === 'derecha' ? 'text-right' : 'text-left'
                  }`}
                >
                  {c.etiqueta}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={claveFila(fila)} className="border-b border-linea hover:bg-verde/[0.03]">
                {columnas.map((c) => (
                  <td
                    key={c.clave}
                    className={`px-3 py-3 align-middle ${
                      c.alineacion === 'derecha' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {c.render(fila)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <ul className="m-0 flex list-none flex-col gap-3 p-0 lg:hidden">
        {filas.map((fila) => (
          <li key={claveFila(fila)} className="flex flex-col gap-2 border border-linea bg-papel-alt p-3.5">
            {columnas
              .filter((c) => !c.secundaria)
              .map((c) => (
                <div key={c.clave} className="flex justify-between gap-3">
                  <span className="text-[11px] font-semibold tracking-[0.06em] text-tinta-suave uppercase">
                    {c.etiqueta}
                  </span>
                  <span className="text-right text-[13.5px]">{c.render(fila)}</span>
                </div>
              ))}
          </li>
        ))}
      </ul>
    </>
  )
}

/** Píldora de estado. El color viene del sistema, no de un semáforo genérico. */
export function Pildora({
  texto,
  tono = 'neutro',
}: {
  texto: string
  tono?: 'neutro' | 'verde' | 'caramelo' | 'alerta'
}) {
  const estilo = {
    neutro: 'border-linea-fuerte text-tinta-suave',
    verde: 'border-verde text-verde',
    caramelo: 'border-caramelo-texto text-caramelo-texto',
    alerta: 'border-alerta text-alerta',
  }[tono]

  return (
    <span
      className={`inline-block border px-2 py-[3px] text-[10.5px] font-semibold tracking-[0.06em] whitespace-nowrap uppercase ${estilo}`}
    >
      {texto}
    </span>
  )
}

/** Métrica del dashboard. Sin operaciones muestra cero, no un guion. */
export function Metrica({
  etiqueta,
  valor,
  detalle,
}: {
  etiqueta: string
  valor: string
  detalle?: string
}) {
  return (
    <div className="flex flex-col gap-1 border border-linea bg-papel-alt px-4 py-4">
      <span className="text-[11px] font-semibold tracking-[0.08em] text-tinta-suave uppercase">
        {etiqueta}
      </span>
      <span className="tnum font-display text-[26px] leading-none">{valor}</span>
      {detalle && <span className="text-[11.5px] text-tinta-suave">{detalle}</span>}
    </div>
  )
}
