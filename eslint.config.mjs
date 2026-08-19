import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

/**
 * `next-env.d.ts` y `.next/` los genera Next: no son código nuestro y no
 * tiene sentido corregirlos. `project/` es el bundle de diseño original, que
 * se conserva intacto como referencia.
 */
const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'project/**',
      'next-env.d.ts',
      'eslint.config.mjs',
    ],
  },
]

export default config
