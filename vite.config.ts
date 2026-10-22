import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

// Versão de homologação para hospedagem estática na Locaweb.
// Preserva todas as rotas do frontend. As APIs /api/** exigem
// migração e homologação separadas antes da troca do DNS.
export default defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    tailwindcss(),
    tanstackStart({
      spa: { enabled: true },
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: false,
        crawlLinks: false,
        failOnError: true,
      },
      pages: [
        { path: '/', prerender: { enabled: true, outputPath: '/index.html' } },
      ],
    }),
    viteReact(),
  ],
})
