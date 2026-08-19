'use client'

import { useActionState } from 'react'
import { cambiarContrasena, type ResultadoAuth } from '@/server/acciones-auth'
import { BotonGuardar, Campo, Entrada, Feedback } from './Piezas'

export function FormularioNuevaContrasena() {
  const [estado, accion] = useActionState(cambiarContrasena, {} as ResultadoAuth)

  return (
    <form action={accion} className="flex flex-col gap-4 border border-linea bg-papel-alt p-5">
      <Campo etiqueta="Nueva contraseña" ayuda="Al menos 10 caracteres.">
        <Entrada name="password" type="password" autoComplete="new-password" required minLength={10} />
      </Campo>
      <Campo etiqueta="Repetir contraseña">
        <Entrada name="repetir" type="password" autoComplete="new-password" required />
      </Campo>
      <Feedback estado={estado} />
      <BotonGuardar>Cambiar contraseña</BotonGuardar>
    </form>
  )
}
