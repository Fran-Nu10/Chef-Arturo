import { redirect } from 'next/navigation'

/**
 * «Medios» dejó de existir como concepto visible: las fotos se cargan desde
 * el producto, la categoría o la sección de contenido correspondiente.
 *
 * La ruta se conserva sólo para que un marcador viejo no termine en un 404.
 * Por detrás no se borró nada: el bucket, `media_assets`, las políticas y los
 * archivos siguen intactos.
 */
export default function PaginaMedios() {
  redirect('/admin/productos')
}
