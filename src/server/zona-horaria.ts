/**
 * La zona horaria del negocio.
 *
 * Chef Arturo opera en Florida, Uruguay. Los pedidos se guardan en `timestamptz`
 * —o sea, en UTC—, y eso está bien: el instante es único. Lo que no está bien
 * es **leerlos** como si el día empezara a medianoche UTC.
 *
 * Uruguay está tres horas detrás de UTC. Un pedido hecho a las 21:30 del martes
 * en Florida se guarda como las 00:30 del miércoles UTC. Recortando la cadena
 * ISO —que es lo que se hacía— ese pedido aparecía en el reporte del miércoles.
 * Para un negocio que toma pedidos de tarde y de noche, eso corre buena parte
 * de la facturación al día siguiente.
 *
 * Se usa `Intl` en lugar de restar tres horas a mano: si Uruguay volviera a
 * tener horario de verano —lo tuvo hasta 2015— la resta fija quedaría mal y
 * esto no.
 */
export const ZONA_NEGOCIO = 'America/Montevideo'

const FORMATO = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_NEGOCIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

interface Partes {
  anio: number
  mes: number
  dia: number
  hora: number
  minuto: number
  segundo: number
}

function partesEnZona(fecha: Date): Partes {
  const p = FORMATO.formatToParts(fecha)
  const leer = (tipo: string) => Number(p.find((x) => x.type === tipo)?.value ?? 0)
  return {
    anio: leer('year'),
    mes: leer('month'),
    dia: leer('day'),
    hora: leer('hour'),
    minuto: leer('minute'),
    segundo: leer('second'),
  }
}

/** Cuánto hay que sumarle a UTC para obtener la hora local en ese instante. */
function desfaseMs(fecha: Date): number {
  const q = partesEnZona(fecha)
  const comoSiFueraUtc = Date.UTC(q.anio, q.mes - 1, q.dia, q.hora, q.minuto, q.segundo)
  return comoSiFueraUtc - Math.floor(fecha.getTime() / 1000) * 1000
}

/** `2026-03-10` — el día en que ocurrió, visto desde Florida. */
export function diaDelNegocio(instante: string | Date): string {
  const q = partesEnZona(typeof instante === 'string' ? new Date(instante) : instante)
  return `${q.anio}-${String(q.mes).padStart(2, '0')}-${String(q.dia).padStart(2, '0')}`
}

/** `2026-03` — el mes en que ocurrió, visto desde Florida. */
export function mesDelNegocio(instante: string | Date): string {
  return diaDelNegocio(instante).slice(0, 7)
}

/**
 * Instante UTC en que empieza ese día en Florida.
 *
 * Se resuelve en dos pasadas: la primera estima el desfase, la segunda lo
 * confirma sobre el instante ya corregido. Hace falta por los días en que el
 * desfase cambia a mitad de jornada.
 */
export function inicioDelDiaUtc(dia: string): string {
  const [anio, mes, d] = dia.split('-').map(Number)
  const tentativo = Date.UTC(anio, mes - 1, d, 0, 0, 0)
  let ms = tentativo - desfaseMs(new Date(tentativo))
  ms = tentativo - desfaseMs(new Date(ms))
  return new Date(ms).toISOString()
}

/** Instante UTC del primer milisegundo del día siguiente. Límite superior exclusivo. */
export function finDelDiaUtc(dia: string): string {
  const [anio, mes, d] = dia.split('-').map(Number)
  const siguiente = new Date(Date.UTC(anio, mes - 1, d))
  siguiente.setUTCDate(siguiente.getUTCDate() + 1)
  return inicioDelDiaUtc(diaUtcPlano(siguiente))
}

function diaUtcPlano(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

/** Hoy, en Florida. */
export function hoyDelNegocio(ahora: Date = new Date()): string {
  return diaDelNegocio(ahora)
}

/** Instante UTC en que empezó el mes corriente en Florida. */
export function inicioDelMesUtc(ahora: Date = new Date()): string {
  return inicioDelDiaUtc(`${mesDelNegocio(ahora)}-01`)
}
