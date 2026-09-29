import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  // mode defines what ".env.{mode}" file to choose if exists
  const env = loadEnv(mode, process.cwd(), '')

  // Guarda: los tests nunca pueden correr contra la base de desarrollo.
  // Va acá y no en el test porque importar app.js ya se conecta a la base.
  if (!env.DB_NAME?.endsWith('_test')) {
    throw new Error(`Los tests no pueden correr contra la base "${env.DB_NAME}". Revisá DB_NAME en .env.test`)
  }

  return {
    test: {
      env,
    },
  }
})
