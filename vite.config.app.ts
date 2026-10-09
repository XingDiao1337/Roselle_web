import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cloudflare-pages-postbuild',
      closeBundle() {
        const outDir = path.resolve(process.cwd(), 'dist-app');
        const appHtml = path.join(outDir, 'app.html');
        const indexHtml = path.join(outDir, 'index.html');
        if (fs.existsSync(appHtml)) {
          fs.copyFileSync(appHtml, indexHtml);
        }

        // Generate Cloudflare Pages _redirects file
        const apiTarget = process.env.VITE_API_BASE_URL ? process.env.VITE_API_BASE_URL.replace(/\/+$/, '') : '';
        const lines: string[] = [
          '# Cloudflare Pages SPA Routing and API Proxy Configuration'
        ];
        if (apiTarget) {
          lines.push(`/api/* ${apiTarget}/api/:splat 200`);
        }
        lines.push('/* /index.html 200');

        fs.writeFileSync(path.join(outDir, '_redirects'), lines.join('\n') + '\n');
      }
    }
  ],
  build: {
    outDir: 'dist-app',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: 'app.html'
      }
    }
  },
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api/web': { target: 'http://127.0.0.1:1337', changeOrigin: false }
    }
  }
});
