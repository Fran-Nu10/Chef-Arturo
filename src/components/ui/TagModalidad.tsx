import type { Disponibilidad, Modalidad } from '@/content/tipos'

/**
 * Etiqueta de modalidad. Siempre borde, nunca relleno.
 * DIRECTA (verde) · ENCARGO / CONSULTAR (caramelo-texto) · AGOTADO (alerta).
 */
const ETIQUETA: Record<Modalidad, { texto: string; corto: string; clase: string }> = {
  directa: {
    texto: 'Compra directa',
    corto: 'Directa',
    clase: 'text-verde border-verde',
  },
  encargo: {
    texto: 'Por encargo',
    corto: 'Encargo',
    clase: 'text-caramelo-texto border-caramelo-texto',
  },
  consultar: {
    texto: 'Consultar',
    corto: 'Consultar',
    clase: 'text-caramelo-texto border-caramelo-texto',
  },
}

const AGOTADO = { texto: 'Agotado hoy', clase: 'text-alerta border-alerta' }
const REQUIERE_FECHA = {
  texto: 'Requiere fecha',
  clase: 'text-caramelo-texto border-caramelo-texto',
}

export function TagModalidad({
  modalidad,
  disponibilidad = 'disponible',
  corto = false,
  className = '',
}: {
  modalidad: Modalidad
  disponibilidad?: Disponibilidad
  corto?: boolean
  className?: string
}) {
  const base =
    disponibilidad === 'agotado'
      ? AGOTADO
      : disponibilidad === 'requiere-fecha'
        ? REQUIERE_FECHA
        : {
            texto: corto ? ETIQUETA[modalidad].corto : ETIQUETA[modalidad].texto,
            clase: ETIQUETA[modalidad].clase,
          }

  return (
    <span
      className={`inline-block border px-[9px] py-[5px] text-[10.5px] font-semibold tracking-[0.07em] whitespace-nowrap uppercase ${base.clase} ${className}`}
    >
      {base.texto}
    </span>
  )
}

/** Nombre legible de la modalidad, para resúmenes y listas. */
export function nombreModalidad(modalidad: Modalidad): string {
  return ETIQUETA[modalidad].texto
}
