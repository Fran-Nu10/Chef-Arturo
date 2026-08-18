'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { OCASION_OPCIONES } from '@/content/datos'
import { Boton } from '@/components/ui/Boton'
import { IconoCalendario } from '@/components/ui/Iconos'
import { Actual, BarraContexto } from '@/components/pantallas/BarraContexto'
import { CampoTexto, Segmentado } from '@/components/pantallas/Campos'
import { Pantalla } from '@/components/pantallas/Estructura'
import { PasosEvento } from '@/components/pantallas/PasosCheckout'

const ETIQUETA = 'text-xs font-semibold tracking-[0.06em] text-caramelo-texto uppercase'

/**
 * Pantalla 19 · Solicitud para evento.
 *
 * Recoge ocasión, personas, fecha, preferencia, retiro o entrega y
 * observaciones. No calcula cantidades ni promete plazos: la disponibilidad se
 * confirma antes de coordinar.
 */
export default function SolicitudEvento() {
  const [paso, setPaso] = useState<1 | 2 | 3>(2)
  const [tipo, setTipo] = useState<string | null>('Reunión familiar')
  const [personas, setPersonas] = useState<string | null>('10 a 25')
  const [fecha, setFecha] = useState('')
  const [preferencia, setPreferencia] = useState<string | null>('Salado')
  const [entrega, setEntrega] = useState<string | null>('Retiro en Florida')
  const [observaciones, setObservaciones] = useState('')
  const router = useRouter()

  return (
    <Pantalla conCarrito={false}>
      <BarraContexto volverA="/catalogo/lunch">
        <Actual>Consultá por tu evento</Actual>
      </BarraContexto>

      <div className="flex flex-col gap-1.5 bg-verde px-4 py-[22px] text-papel">
        <div className="text-[10.5px] font-semibold tracking-[0.14em] text-caramelo-claro">
          LUNCH PARA FIESTAS
        </div>
        <h1 className="m-0 font-display text-[26px] font-normal">Armá tu ocasión</h1>
        <p className="m-0 text-[12.5px] leading-relaxed text-crema">
          Con estos datos preparamos una propuesta. La disponibilidad se confirma antes de
          coordinar.
        </p>
        <PasosEvento paso={paso} />
        <div className="text-[11px] font-medium text-caramelo-claro">
          Paso <span className="tnum">{paso}</span> de <span className="tnum">3</span>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pt-5 pb-6">
        {paso === 1 && (
          <>
            <Segmentado
              etiqueta="Tipo de ocasión"
              opciones={OCASION_OPCIONES.tipo}
              valor={tipo}
              onElegir={setTipo}
            />
            <Segmentado
              etiqueta="Cantidad aproximada de personas"
              opciones={OCASION_OPCIONES.personas}
              valor={personas}
              onElegir={setPersonas}
            />
          </>
        )}

        {paso === 2 && (
          <>
            <div className="flex flex-col gap-2">
              <span className={ETIQUETA}>Fecha deseada</span>
              <label className="flex min-h-[46px] items-center gap-2.5 border border-verde bg-papel-alt px-3">
                <IconoCalendario size={16} className="flex-none text-verde" />
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  aria-label="Fecha deseada"
                  className="min-h-[44px] w-full bg-transparent text-[13.5px] font-medium focus:outline-none"
                />
              </label>
              <span className="text-[11px] text-caramelo-texto">
                Anticipación por confirmar según el pedido.
              </span>
            </div>
            <Segmentado
              etiqueta="Preferencia general"
              opciones={OCASION_OPCIONES.preferencia}
              valor={preferencia}
              onElegir={setPreferencia}
            />
            <Segmentado
              etiqueta="Retiro o entrega"
              opciones={OCASION_OPCIONES.entrega}
              valor={entrega}
              onElegir={setEntrega}
            />
          </>
        )}

        {paso === 3 && (
          <CampoTexto
            etiqueta="Observaciones"
            multilinea
            placeholder="Lo que quieras contarnos sobre tu ocasión"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            ayuda="La disponibilidad será confirmada antes de coordinar el pedido."
          />
        )}

        <div className="flex justify-between border-t border-linea pt-3.5">
          <Boton
            variante="secundario"
            compacto
            className="px-4 text-[13px]"
            disabled={paso === 1}
            onClick={() => setPaso((p) => (p > 1 ? ((p - 1) as 1 | 2) : p))}
          >
            ← Volver
          </Boton>
          <Boton
            compacto
            className="px-6 text-[13.5px]"
            onClick={() =>
              paso < 3
                ? setPaso((p) => (p + 1) as 2 | 3)
                : router.push('/evento/confirmacion')
            }
          >
            {paso < 3 ? 'Siguiente →' : 'Enviar solicitud'}
          </Boton>
        </div>
      </div>
    </Pantalla>
  )
}
