import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'Panel', template: '%s · Panel Chef Arturo' },
  robots: { index: false, follow: false },
}

/**
 * Envoltorio de todo `/admin`: metadatos y nada más.
 *
 * Antes este layout era el guard: leía `x-pathname`, y si la ruta no empezaba
 * por `/admin/login` exigía sesión y redirigía al login. El problema no era la
 * cabecera sino la forma del árbol —`/admin/login` colgaba del mismo layout
 * que redirigía hacia él—. En una navegación de cliente el router pedía
 * `/admin`, recibía el redirect, y al pedir `/admin/login` seguía por debajo
 * de ese layout: el segmento nunca terminaba de resolverse y el navegador
 * quedaba en bucle pidiendo la misma carga, con la pantalla en blanco.
 *
 * Ahora el guard vive en `(panel)/layout.tsx` y sólo envuelve las rutas
 * protegidas. `login` y `recuperar` son hermanas, no hijas: el destino del
 * redirect ya no está dentro de quien redirige. Además el guard dejó de
 * depender de una cabecera para saber dónde está — la estructura lo dice.
 */
export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return children
}
