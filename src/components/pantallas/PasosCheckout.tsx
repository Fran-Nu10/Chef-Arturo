/**
 * Progreso del checkout: cuatro barras, un paso por vista.
 * Un error de pago no retrocede este progreso ni destruye lo ya elegido.
 */
export function PasosCheckout({ paso }: { paso: 1 | 2 | 3 | 4 }) {
  return (
    <div
      className="flex gap-[5px] px-4 pt-3.5 lg:px-0"
      role="img"
      aria-label={`Paso ${paso} de 4`}
    >
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={`h-[3px] flex-1 ${n <= paso ? 'bg-caramelo' : 'bg-linea'}`}
        />
      ))}
    </div>
  )
}

/** Progreso de tres pasos, sobre fondo verde (solicitud de evento). */
export function PasosEvento({ paso }: { paso: 1 | 2 | 3 }) {
  return (
    <div className="mt-2 flex gap-[5px]" role="img" aria-label={`Paso ${paso} de 3`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`h-[3px] flex-1 ${n <= paso ? 'bg-caramelo-claro' : 'bg-papel/25'}`}
        />
      ))}
    </div>
  )
}
