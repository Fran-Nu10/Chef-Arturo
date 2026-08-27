'use client'

/**
 * Último recurso: un fallo en el layout raíz.
 *
 * `app/error.tsx` no lo cubre —el layout está por encima— así que sin esto
 * un problema al leer el catálogo en el layout dejaba la pantalla en blanco.
 * Reemplaza el documento entero, por eso trae su propio `<html>` y estilos
 * en línea: no puede depender de nada que quizá no cargó.
 */
export default function ErrorGlobal({ reset }: { reset: () => void }) {
  return (
    <html lang="es-UY">
      <body
        style={{
          margin: 0,
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
          padding: '32px',
          textAlign: 'center',
          background: '#f7f3ea',
          color: '#1a211e',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <p style={{ margin: 0, fontSize: '13px', letterSpacing: '0.2em', color: '#1e4b40' }}>
          CHEF ARTURO
        </p>
        <h1 style={{ margin: 0, fontWeight: 400, fontSize: '24px', color: '#1e4b40' }}>
          La tienda no está respondiendo
        </h1>
        <p style={{ margin: 0, maxWidth: '40ch', fontSize: '14px', color: '#6e675a' }}>
          Volvé a intentar en un momento. Si te urge, escribinos por WhatsApp y te
          atendemos igual.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: '48px',
            padding: '0 24px',
            border: '1px solid #1e4b40',
            background: '#1e4b40',
            color: '#f7f3ea',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  )
}
