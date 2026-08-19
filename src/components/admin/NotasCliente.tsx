'use client'

import { useActionState } from 'react'
import { guardarNotaCliente } from '@/server/pedidos/acciones'
import type { Resultado } from '@/server/catalogo/acciones'
import { AreaTexto, BotonGuardar, Feedback } from './Piezas'

export function NotasCliente({ clienteId, notas }: { clienteId: string; notas: string }) {
  const [estado, accion] = useActionState(guardarNotaCliente, {} as Resultado)

  return (
    <section aria-labelledby="notas-cliente" className="flex flex-col gap-3 border border-linea bg-papel-alt p-4">
      <h2 id="notas-cliente" className="m-0 font-display text-xl font-normal">
        Notas internas
      </h2>
      <p className="m-0 text-[12px] text-tinta-suave">
        Sólo las ve el equipo. El cliente nunca las lee.
      </p>
      <form action={accion} className="flex flex-col gap-3">
        <input type="hidden" name="customerId" value={clienteId} />
        <AreaTexto name="internalNotes" rows={5} defaultValue={notas} aria-label="Notas internas" />
        <Feedback estado={estado} />
        <BotonGuardar variante="secundario">Guardar notas</BotonGuardar>
      </form>
    </section>
  )
}
