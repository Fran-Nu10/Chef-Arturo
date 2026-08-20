import type { NextConfig } from 'next'

/**
 * Host de las imágenes del catálogo.
 *
 * Las fotos de producto viven en Supabase Storage y `next/image` rechaza
 * cualquier host remoto que no esté declarado. El host se deriva de la URL del
 * proyecto para no escribirlo dos veces; sin la variable (modo demo) no se
 * declara ninguno y las imágenes remotas simplemente no existen.
 */
function hostDeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return []
  try {
    const { protocol, hostname } = new URL(url)
    return [
      {
        protocol: protocol.replace(':', '') as 'http' | 'https',
        hostname,
        pathname: '/storage/v1/object/public/**',
      },
    ]
  } catch {
    return []
  }
}

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: hostDeSupabase(),
  },
}

export default nextConfig
