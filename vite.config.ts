import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    base: mode === 'production' ? '/cnm-demo/' : '/',
    define: {
      __VITE_INTEGRAIL_BEARER_TOKEN__: JSON.stringify(env.VITE_INTEGRAIL_BEARER_TOKEN),
      __VITE_INTEGRAIL_ACCOUNT_ID__: JSON.stringify(env.VITE_INTEGRAIL_ACCOUNT_ID),
    }
  }
})