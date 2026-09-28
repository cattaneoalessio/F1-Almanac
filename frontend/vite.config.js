import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { pluginSeo } from './scripts/plugin-seo.mjs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Interruttore unico dell'indicizzazione: SITO_PUBBLICO=true (variabile
  // d'ambiente di Netlify). Qualsiasi altro valore, o assenza, = NON pubblico.
  const pubblico = (process.env.SITO_PUBBLICO ?? env.SITO_PUBBLICO) === 'true'
  return {
    plugins: [react(), pluginSeo({ pubblico, apiBase: process.env.VITE_API_BASE_URL ?? env.VITE_API_BASE_URL })],
    define: { __SITO_PUBBLICO__: JSON.stringify(pubblico) },
  }
})
