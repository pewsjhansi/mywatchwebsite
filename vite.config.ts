import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
        checkout: resolve(import.meta.dirname, 'checkout.html'),
        compare: resolve(import.meta.dirname, 'compare.html'),
        dashboard: resolve(import.meta.dirname, 'dashboard.html'),
        product: resolve(import.meta.dirname, 'product.html'),
        shop: resolve(import.meta.dirname, 'shop.html'),
        success: resolve(import.meta.dirname, 'success.html')
      }
    }
  }
})
