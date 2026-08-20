import { Esqueleto } from '@/components/admin/Chasis'

/**
 * Feedback inmediato para las transiciones del panel.
 *
 * Además de evitar clics repetidos, este límite de carga permite que Next
 * precargue el chasis de las rutas dinámicas sin esperar todas las consultas.
 */
export default function CargandoPanel() {
  return (
    <div role="status" aria-live="polite" aria-label="Cargando sección">
      <header className="flex flex-col gap-2 border-b border-linea px-4 py-5 lg:px-8">
        <Esqueleto className="h-7 w-44" />
        <Esqueleto className="h-4 w-full max-w-md" />
      </header>

      <div className="grid gap-4 px-4 py-6 lg:grid-cols-2 lg:px-8">
        <Esqueleto className="h-32 w-full" />
        <Esqueleto className="h-32 w-full" />
        <Esqueleto className="h-56 w-full lg:col-span-2" />
      </div>

      <span className="sr-only">Cargando la sección seleccionada…</span>
    </div>
  )
}
