// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        csv: resolve(__dirname, 'from-csv.html'),
        sample: resolve(__dirname, 'from-smaple.html'),
        table: resolve(__dirname, 'from-table.html'),
      },
    },
  },
})