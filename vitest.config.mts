import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // `server-only` es un centinela de Next: existe para romper el build si
      // un módulo de servidor se importa desde cliente. En Vitest no aporta
      // nada y no está instalado como paquete propio, así que se neutraliza.
      'server-only': fileURLToPath(new URL('./src/server/__tests__/server-only.ts', import.meta.url)),
    },
  },
})
