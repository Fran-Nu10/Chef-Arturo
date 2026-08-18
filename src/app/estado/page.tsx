'use client'

import { useState } from 'react'
import { NEGOCIO } from '@/content/datos'
import { Boton, BotonEnlace } from '@/components/ui/Boton'
import { Actual, BarraContexto } from '@/components/pantallas/BarraContexto'
import { Pantalla } from '@/components/pantallas/Estructura'

/** Recibido → Confirmado → Listo. El último paso todavía no ocurrió. */
const HITOS = [
  {
    titulo: 'Recibido',
    detalle: 'Tu pedido entró a la cocina.',
    cumplido: true,
  },
  {
    titulo: 'Confirmado',
    detalle: 'Disponibilidad y total confirmados.',
    cumplido: true,
  },
  {
    titulo: 'Listo para retiro o entrega',
    detalle: 'Te avisamos por WhatsApp.',
    cumplido: false,
  },
]

/** Pantalla 21 · Consulta de estado del pedido por código o teléfono. */
export default function EstadoDelPedido() {
  const [consulta, setConsulta] = useState('')

  return (
    <Pantalla conCarrito={false}>
      <BarraContexto volverA="/">
        <Actual>Estado de tu pedido</Actual>
      </BarraContexto>

      <div className="flex flex-col gap-[18px] px-4 pt-5 pb-[26px]">
        <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
          <label
            htmlFor="consulta-pedido"
            className="text-xs font-semibold tracking-[0.06em] text-caramelo-texto uppercase"
          >
            Nº de pedido o teléfono
          </label>
          <div className="flex gap-2">
            <input
              id="consulta-pedido"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="CA-····"
              className="min-h-[48px] flex-1 border border-linea-fuerte bg-papel-alt px-3 text-sm font-medium placeholder:text-tinta-tenue focus:border-verde"
            />
            <Boton compacto className="px-[18px] text-[13.5px]">
              Buscar
            </Boton>
          </div>
        </form>

        <div className="flex flex-col border border-linea bg-papel-alt px-3.5 py-4">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="tnum font-display text-[19px]">Pedido Nº CA-····</span>
            <span className="text-[10.5px] text-tinta-tenue">estado de ejemplo</span>
          </div>

          <ol className="m-0 flex list-none flex-col p-0">
            {HITOS.map((hito, i) => {
              const ultimo = i === HITOS.length - 1
              return (
                <li key={hito.titulo} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`h-3.5 w-3.5 flex-none rounded-full ${
                        hito.cumplido
                          ? 'bg-verde'
                          : 'border-[1.5px] border-linea-fuerte bg-papel'
                      }`}
                    />
                    {!ultimo && (
                      <span
                        className={`w-0.5 flex-1 ${
                          HITOS[i + 1].cumplido ? 'bg-verde' : 'bg-linea'
                        }`}
                      />
                    )}
                  </div>
                  <div className={ultimo ? '' : 'pb-4'}>
                    <div
                      className={`text-[13px] font-semibold ${
                        hito.cumplido ? 'text-tinta' : 'text-tinta-tenue'
                      }`}
                    >
                      {hito.titulo}
                    </div>
                    <div
                      className={`text-[11.5px] ${
                        hito.cumplido ? 'text-tinta-suave' : 'text-tinta-tenue'
                      }`}
                    >
                      {hito.detalle}
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <BotonEnlace href={NEGOCIO.whatsapp} variante="secundario" compacto>
          Consultar por WhatsApp
        </BotonEnlace>
      </div>
    </Pantalla>
  )
}
