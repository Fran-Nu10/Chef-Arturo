/**
 * Reglas compartidas de las imágenes del panel.
 *
 * Las usa el navegador (para validar antes de subir) y el servidor (para
 * validar de nuevo antes de registrar). Son las mismas reglas que aplica el
 * bucket `media` de Supabase: JPG, PNG, WebP o AVIF, hasta 10 MB. Nada de SVG
 * ni HTML: pueden llevar scripts y el bucket es público.
 */

export const FORMATOS_IMAGEN = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
} as const

export type MimeImagen = keyof typeof FORMATOS_IMAGEN

export const TAMANO_MAXIMO_IMAGEN = 10 * 1024 * 1024

/** Cada tipo de imagen vive en su carpeta del bucket. */
export const CARPETAS_DE_SUBIDA = ['productos', 'categorias', 'contenido'] as const
export type CarpetaDeSubida = (typeof CARPETAS_DE_SUBIDA)[number]

export const MENSAJE_FORMATO = 'Ese formato de imagen no está permitido. Usá JPG, PNG, WebP o AVIF.'
export const MENSAJE_TAMANO = 'La foto supera el máximo de 10 MB.'
export const MENSAJE_SUBIDA = 'No pudimos subir la imagen. Probá nuevamente.'

/**
 * Ruta única y segura dentro del bucket: `productos/<uuid>.<ext>`.
 *
 * El nombre nunca sale del archivo del usuario: un UUID no colisiona, no pisa
 * nada y no puede escaparse de su carpeta.
 */
export function rutaDeSubida(carpeta: CarpetaDeSubida, uuid: string, mime: MimeImagen): string {
  return `${carpeta}/${uuid}.${FORMATOS_IMAGEN[mime]}`
}

const RUTA_VALIDA =
  /^(productos|categorias|contenido)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|avif)$/

/**
 * ¿La ruta tiene exactamente la forma que genera `rutaDeSubida`?
 *
 * El servidor no confía en la ruta que le llega del formulario: si no es
 * `<carpeta>/<uuid>.<ext>` —sin `..`, sin subcarpetas, sin nombres libres—
 * se rechaza entera.
 */
export function esRutaDeSubida(ruta: string, carpeta?: CarpetaDeSubida): boolean {
  if (!RUTA_VALIDA.test(ruta)) return false
  return carpeta ? ruta.startsWith(`${carpeta}/`) : true
}

const MIME_POR_EXTENSION: Record<string, MimeImagen> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
}

export function mimeDeRuta(ruta: string): MimeImagen | null {
  const extension = ruta.split('.').pop() ?? ''
  return MIME_POR_EXTENSION[extension] ?? null
}

/**
 * Detecta el formato real mirando los primeros bytes del archivo.
 *
 * `file.type` lo declara el navegador a partir de la extensión y se puede
 * falsear renombrando el archivo. La firma binaria no: un PNG empieza con
 * `\x89PNG`, un JPEG con `\xFF\xD8\xFF`, un WebP es un RIFF con la marca
 * `WEBP` y un AVIF declara `ftypavif` en su primera caja. Lo que no coincida
 * con ninguna —un SVG, un PDF renombrado, un HTML— se rechaza.
 */
export function detectarFormatoImagen(bytes: Uint8Array): MimeImagen | null {
  if (bytes.length < 12) return null

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'

  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png'
  }

  const ascii = (desde: number, hasta: number) =>
    String.fromCharCode(...bytes.slice(desde, hasta))

  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'

  // AVIF: caja ISO-BMFF `ftyp` con marca mayor `avif` o `avis` (secuencias).
  if (ascii(4, 8) === 'ftyp') {
    const marca = ascii(8, 12)
    if (marca === 'avif' || marca === 'avis') return 'image/avif'
  }

  return null
}
