'use client'

import { useActionState, useState } from 'react'
import {
  ajustarImportes,
  cambiarEstadoPedido,
  guardarNotaInterna,
  registrarCoordinacionWhatsapp,
} from '@/server/pedidos/acciones'
import type { Resultado } from '@/server/catalogo/acciones'
import { ETIQUETA_ESTADO_PEDIDO } from '@/lib/etiquetas'
import { TRANSICIONES, transicionPermitida } from '@/server/validacion'
import type { EstadoPedido } from '@/lib/supabase/tipos'
import { AreaTexto, BotonGuardar, Campo, Entrada, Feedback } from './Piezas'

const ESTADOS: EstadoPedido[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
]

/**
 * Acciones sobre un pedido.
 *
 * El selector ofrece primero las transiciones coherentes. Las demás siguen
 * disponibles —hay operaciones reales que no siguen el guion— pero exigen
 * marcar una casilla de confirmación con la advertencia a la vista.
 */
export function PanelPedido({
  pedido,
  telefonoCliente,
}: {
  pedido: {
    id: string
    orderNumber: string
    status: EstadoPedido
    internalNotes: string
    shippingCents: number
    discountCents: number
  }
  telefonoCliente: string
}) {
  const [estadoElegido, setEstadoElegido] = useState<EstadoPedido>(pedido.status)
  const [cambio, accionCambio] = useActionState(cambiarEstadoPedido, {} as Resultado)
  const [notas, accionNotas] = useActionState(guardarNotaInterna, {} as Resultado)
  const [importes, accionImportes] = useActionState(ajustarImportes, {} as Resultado)
  const [whats, accionWhats] = useActionState(registrarCoordinacionWhatsapp, {} as Resultado)

  const permitidas = TRANSICIONES[pedido.status]
  const esIncoherente =
    estadoElegido !== pedido.status && !transicionPermitida(pedido.status, estadoElegido)

  const wa = telefonoCliente.replace(/[^0-9]/g, '')
  const mensaje = encodeURIComponent(
    `Hola, te escribimos de Chef Arturo por tu pedido ${pedido.orderNumber}.`,
  )

  return (
    <div className="flex flex-col gap-6">
      {/* ── Estado ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="cambiar-estado" className="flex flex-col gap-3 border border-linea bg-papel-alt p-4">
        <h2 id="cambiar-estado" className="m-0 font-display text-xl font-normal">
          Cambiar estado
        </h2>

        {permitidas.length === 0 ? (
          <p className="m-0 text-[13px] text-tinta-suave">
            El pedido está en un estado final ({ETIQUETA_ESTADO_PEDIDO[pedido.status]}). No
            admite más cambios.
          </p>
        ) : (
          <form action={accionCambio} className="flex flex-col gap-3">
            <input type="hidden" name="orderId" value={pedido.id} />

            <Campo etiqueta="Nuevo estado">
              <select
                name="nuevoEstado"
                value={estadoElegido}
                onChange={(e) => setEstadoElegido(e.target.value as EstadoPedido)}
                className="min-h-[44px] w-full border border-linea-fuerte bg-papel px-3 text-sm focus:border-verde focus:outline-none"
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {ETIQUETA_ESTADO_PEDIDO[e]}
                    {!transicionPermitida(pedido.status, e) && e !== pedido.status
                      ? ' — fuera del flujo'
                      : ''}
                  </option>
                ))}
              </select>
            </Campo>

            {esIncoherente && (
              <div className="border border-alerta bg-alerta-fondo px-3 py-2.5">
                <p className="m-0 text-[13px] text-alerta">
                  Pasar de <strong>{ETIQUETA_ESTADO_PEDIDO[pedido.status]}</strong> a{' '}
                  <strong>{ETIQUETA_ESTADO_PEDIDO[estadoElegido]}</strong> no sigue el flujo
                  previsto.
                </p>
                <label className="mt-2 flex min-h-[44px] cursor-pointer items-center gap-2 text-[13px] font-medium text-alerta">
                  <input type="checkbox" name="forzar" className="h-4 w-4 accent-[#b04a28]" />
                  Entiendo y quiero forzar el cambio
                </label>
              </div>
            )}

            <Campo etiqueta="Nota (opcional)" ayuda="Queda en el historial del pedido.">
              <Entrada name="nota" maxLength={500} />
            </Campo>

            <Feedback estado={cambio} />
            <BotonGuardar>Aplicar cambio</BotonGuardar>
          </form>
        )}
      </section>

      {/* ── Importes ───────────────────────────────────────────────────── */}
      <section aria-labelledby="importes" className="flex flex-col gap-3 border border-linea bg-papel-alt p-4">
        <h2 id="importes" className="m-0 font-display text-xl font-normal">
          Envío y descuento
        </h2>
        <p className="m-0 text-[12px] leading-relaxed text-tinta-suave">
          El subtotal y el total se recalculan en el servidor desde las líneas del pedido.
          Sólo se pueden ajustar estos dos conceptos.
        </p>
        <form action={accionImportes} className="flex flex-col gap-3">
          <input type="hidden" name="orderId" value={pedido.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo etiqueta="Envío (pesos)">
              <Entrada
                name="envio"
                type="number"
                min={0}
                step="0.01"
                defaultValue={pedido.shippingCents / 100}
              />
            </Campo>
            <Campo etiqueta="Descuento (pesos)">
              <Entrada
                name="descuento"
                type="number"
                min={0}
                step="0.01"
                defaultValue={pedido.discountCents / 100}
              />
            </Campo>
          </div>
          <Feedback estado={importes} />
          <BotonGuardar variante="secundario">Recalcular total</BotonGuardar>
        </form>
      </section>

      {/* ── WhatsApp ───────────────────────────────────────────────────── */}
      <section aria-labelledby="whatsapp" className="flex flex-col gap-3 border border-linea bg-papel-alt p-4">
        <h2 id="whatsapp" className="m-0 font-display text-xl font-normal">
          Coordinación por WhatsApp
        </h2>
        {wa ? (
          <a
            href={`https://wa.me/${wa}?text=${mensaje}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] w-fit items-center border border-verde px-4 text-[13px] font-medium text-verde no-underline hover:bg-verde/[0.07]"
          >
            Abrir chat con el mensaje preparado
          </a>
        ) : (
          <p className="m-0 text-[13px] text-tinta-suave">El cliente no tiene teléfono cargado.</p>
        )}

        <form action={accionWhats} className="flex flex-col gap-3">
          <input type="hidden" name="orderId" value={pedido.id} />
          <Campo
            etiqueta="Registrar lo coordinado"
            ayuda="Queda en el historial y en las notas internas. No cambia el estado del pago."
          >
            <AreaTexto name="detalle" rows={2} maxLength={1000} />
          </Campo>
          <Feedback estado={whats} />
          <BotonGuardar variante="secundario">Registrar</BotonGuardar>
        </form>
      </section>

      {/* ── Notas ──────────────────────────────────────────────────────── */}
      <section aria-labelledby="notas" className="flex flex-col gap-3 border border-linea bg-papel-alt p-4">
        <h2 id="notas" className="m-0 font-display text-xl font-normal">
          Notas internas
        </h2>
        <form action={accionNotas} className="flex flex-col gap-3">
          <input type="hidden" name="orderId" value={pedido.id} />
          <AreaTexto
            name="internalNotes"
            rows={5}
            defaultValue={pedido.internalNotes}
            aria-label="Notas internas del pedido"
          />
          <Feedback estado={notas} />
          <BotonGuardar variante="secundario">Guardar notas</BotonGuardar>
        </form>
      </section>
    </div>
  )
}
