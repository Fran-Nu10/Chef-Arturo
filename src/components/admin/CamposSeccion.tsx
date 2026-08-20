'use client'

import type { ClaveSeccion } from '@/server/contenido/esquemas'
import { DESTINOS_PERMITIDOS } from '@/server/contenido/esquemas'
import { AreaTexto, Campo, Casilla, Entrada, Seleccion } from './Piezas'

/**
 * Formulario estructurado de cada sección.
 *
 * El administrador nunca escribe JSON ni HTML: edita campos con nombre y tipo.
 * Los destinos de CTA salen de una lista cerrada, no de un input de URL libre.
 */

type Valor = Record<string, unknown>

function leer(valor: Valor, ruta: string): string {
  const partes = ruta.split('.')
  let actual: unknown = valor
  for (const p of partes) {
    if (actual && typeof actual === 'object') actual = (actual as Valor)[p]
    else return ''
  }
  return actual == null ? '' : String(actual)
}

function escribir(valor: Valor, ruta: string, nuevo: unknown): Valor {
  const partes = ruta.split('.')
  const copia: Valor = { ...valor }
  let actual: Valor = copia
  for (let i = 0; i < partes.length - 1; i++) {
    const p = partes[i]
    actual[p] = { ...((actual[p] as Valor) ?? {}) }
    actual = actual[p] as Valor
  }
  actual[partes[partes.length - 1]] = nuevo
  return copia
}

interface Props {
  clave: ClaveSeccion
  valor: Valor
  onCambio: (v: Valor) => void
}

function CampoTextoCtl({
  etiqueta,
  ruta,
  valor,
  onCambio,
  largo = false,
  ayuda,
}: {
  etiqueta: string
  ruta: string
  valor: Valor
  onCambio: (v: Valor) => void
  largo?: boolean
  ayuda?: string
}) {
  const props = {
    value: leer(valor, ruta),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onCambio(escribir(valor, ruta, e.target.value)),
  }
  return (
    <Campo etiqueta={etiqueta} ayuda={ayuda}>
      {largo ? <AreaTexto rows={3} {...props} /> : <Entrada {...props} />}
    </Campo>
  )
}

function CampoCta({
  etiqueta,
  ruta,
  valor,
  onCambio,
}: {
  etiqueta: string
  ruta: string
  valor: Valor
  onCambio: (v: Valor) => void
}) {
  return (
    <fieldset className="m-0 flex flex-col gap-3 border border-linea p-3">
      <legend className="px-1 text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
        {etiqueta}
      </legend>
      <CampoTextoCtl etiqueta="Texto del botón" ruta={`${ruta}.etiqueta`} valor={valor} onCambio={onCambio} />
      <Campo etiqueta="Destino" ayuda="Sólo rutas del propio sitio o el WhatsApp del negocio.">
        <Seleccion
          value={leer(valor, `${ruta}.destino`)}
          onChange={(e) => onCambio(escribir(valor, `${ruta}.destino`, e.target.value))}
        >
          <option value="">Elegí un destino</option>
          {DESTINOS_PERMITIDOS.map((d) => (
            <option key={d} value={d}>
              {d === 'whatsapp' ? 'WhatsApp del negocio' : d}
            </option>
          ))}
        </Seleccion>
      </Campo>
    </fieldset>
  )
}

function CampoMedia({
  etiqueta,
  ruta,
  valor,
  onCambio,
}: {
  etiqueta: string
  ruta: string
  valor: Valor
  onCambio: (v: Valor) => void
}) {
  return (
    <fieldset className="m-0 flex flex-col gap-3 border border-linea p-3">
      <legend className="px-1 text-xs font-semibold tracking-[0.05em] text-caramelo-texto uppercase">
        {etiqueta}
      </legend>
      <CampoTextoCtl
        etiqueta="Id de la imagen"
        ruta={`${ruta}.mediaId`}
        valor={valor}
        onCambio={onCambio}
        ayuda="Copialo desde Medios. Vacío deja el hueco marcado como pendiente."
      />
      <CampoTextoCtl
        etiqueta="Texto alternativo"
        ruta={`${ruta}.alt`}
        valor={valor}
        onCambio={onCambio}
        ayuda="Describí la escena. No nombres un plato que no esté validado."
      />
    </fieldset>
  )
}

export function CamposSeccion({ clave, valor, onCambio }: Props) {
  const t = (etiqueta: string, ruta: string, largo = false, ayuda?: string) => (
    <CampoTextoCtl
      key={ruta}
      etiqueta={etiqueta}
      ruta={ruta}
      valor={valor}
      onCambio={onCambio}
      largo={largo}
      ayuda={ayuda}
    />
  )

  switch (clave) {
    case 'hero':
      return (
        <div className="flex flex-col gap-4">
          {t('Kicker', 'kicker')}
          {t('Título', 'titulo')}
          {t('Bajada', 'bajada', true)}
          <CampoCta etiqueta="CTA principal" ruta="ctaPrimario" valor={valor} onCambio={onCambio} />
          <CampoCta etiqueta="CTA secundario" ruta="ctaSecundario" valor={valor} onCambio={onCambio} />
          <CampoMedia etiqueta="Imagen del arco" ruta="media" valor={valor} onCambio={onCambio} />
          <Casilla
            etiqueta="Marcar el video como pendiente"
            checked={valor.videoPendiente !== false}
            onChange={(e) => onCambio(escribir(valor, 'videoPendiente', e.target.checked))}
          />
        </div>
      )

    case 'categorias':
      return (
        <div className="flex flex-col gap-4">
          {t('Número', 'numero')}
          {t('Kicker', 'kicker')}
          {t('Título', 'titulo')}
          <p className="m-0 text-[12.5px] text-tinta-suave">
            Las tres categorías se toman del catálogo. Editá sus textos e imágenes en{' '}
            <strong>Categorías</strong>.
          </p>
        </div>
      )

    case 'detalle-final':
      return (
        <div className="flex flex-col gap-4">
          {t('Número', 'numero')}
          {t('Kicker', 'kicker')}
          {t('Título', 'titulo')}
          {t('Frase 1', 'frases.0')}
          {t('Frase 2', 'frases.1')}
          {t('Frase 3', 'frases.2')}
          <CampoMedia etiqueta="Poster del video" ruta="media" valor={valor} onCambio={onCambio} />
          <Casilla
            etiqueta="Marcar el video como pendiente"
            checked={valor.videoPendiente !== false}
            onChange={(e) => onCambio(escribir(valor, 'videoPendiente', e.target.checked))}
          />
        </div>
      )

    case 'arma-tu-evento':
      return (
        <div className="flex flex-col gap-4">
          {t('Número', 'numero')}
          {t('Kicker', 'kicker')}
          {t('Título', 'titulo')}
          {t('Bajada', 'bajada', true)}
          <CampoMedia etiqueta="Imagen" ruta="media" valor={valor} onCambio={onCambio} />
        </div>
      )

    case 'fechas-importantes':
      return (
        <div className="flex flex-col gap-4">
          {t('Número', 'numero')}
          {t('Kicker', 'kicker')}
          {t('Título', 'titulo')}
          {t('Bajada', 'bajada', true)}
          <p className="m-0 border border-dashed border-caramelo px-3 py-2 text-[12.5px] text-caramelo-texto">
            Las campañas nacen marcadas como material de demostración. Desmarcá esa
            casilla sólo cuando la campaña sea real.
          </p>
        </div>
      )

    case 'formas-de-pedir':
      return (
        <div className="flex flex-col gap-4">
          {t('Número', 'numero')}
          {t('Kicker', 'kicker')}
          {t('Título', 'titulo')}
        </div>
      )

    case 'la-mesa':
      return (
        <div className="flex flex-col gap-4">
          {t('Número', 'numero')}
          {t('Kicker', 'kicker')}
          {t('Título', 'titulo')}
          <CampoCta etiqueta="Enlace a Instagram" ruta="enlaceInstagram" valor={valor} onCambio={onCambio} />
        </div>
      )

    case 'cta-final':
      return (
        <div className="flex flex-col gap-4">
          {t('Kicker', 'kicker')}
          {t('Título', 'titulo')}
          <CampoCta etiqueta="CTA principal" ruta="ctaPrimario" valor={valor} onCambio={onCambio} />
          <CampoCta etiqueta="CTA secundario" ruta="ctaSecundario" valor={valor} onCambio={onCambio} />
          {t('Nota', 'nota', false, 'Por ejemplo: "Ubicación exacta pendiente de validación".')}
          <CampoMedia etiqueta="Imagen" ruta="media" valor={valor} onCambio={onCambio} />
        </div>
      )

    case 'footer':
      return (
        <div className="flex flex-col gap-4">
          {t('Leyenda', 'leyenda', true)}
          <Casilla
            etiqueta="Mostrar la ubicación"
            checked={valor.mostrarUbicacion !== false}
            onChange={(e) => onCambio(escribir(valor, 'mostrarUbicacion', e.target.checked))}
          />
        </div>
      )

    default:
      return null
  }
}
