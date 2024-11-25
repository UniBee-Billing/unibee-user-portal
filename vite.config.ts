// https://stackoverflow.com/questions/69417788/vite-https-on-localhost
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import dns from 'node:dns'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

// dns.setDefaultResultOrder('verbatim')

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl(), svgr()],
  server: {
    host: true,
    port: 5173
  }
})
