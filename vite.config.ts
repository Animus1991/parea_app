import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';
import {buildCsp, cspHeaderName, cspMode} from './server/csp';

/**
 * Static hosting (Cloudflare Pages): add the same Content-Security-Policy as
 * server.ts to dist/_headers, built from this build's VITE_* settings.
 */
function staticCspHeaders(env: Record<string, string>): Plugin {
  return {
    name: 'nakamas-static-csp',
    apply: 'build',
    closeBundle() {
      const header = cspHeaderName(cspMode(env));
      const file = path.resolve(__dirname, 'dist/_headers');
      if (!header || !fs.existsSync(file)) return;
      const current = fs.readFileSync(file, 'utf8');
      if (current.includes('Content-Security-Policy')) return;
      const next = current.replace(/^\/\*\n/m, `/*\n  ${header}: ${buildCsp(env)}\n`);
      fs.writeFileSync(file, next);
    },
  };
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const googleMapsKey =
    env.VITE_GOOGLE_MAPS_API_KEY ||
    env.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    '';
  return {
    plugins: [react(), tailwindcss(), staticCspHeaders(env)],
    define: {
      // Security (Ε1): GEMINI_API_KEY is intentionally NOT defined here — it must
      // never be inlined into the client bundle. AI calls go through server.ts
      // (/api/ai/*). For a client-only key, opt in explicitly via VITE_GEMINI_API_KEY.
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(googleMapsKey),
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(googleMapsKey),
      'import.meta.env.VITE_GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(googleMapsKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          // Long-lived vendor chunks: they change rarely, so browsers keep them
          // cached across app deploys. Firebase is already loaded on demand.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'vendor-react';
            if (/node_modules\/(motion|motion-dom|motion-utils|framer-motion)\//.test(id)) return 'vendor-motion';
            if (/node_modules\/(date-fns)\//.test(id)) return 'vendor-date';
            // Split heavy, slowly-changing libs out of the main index chunk for mobile TTI.
            if (/node_modules\/@radix-ui\//.test(id)) return 'vendor-radix';
            if (/node_modules\/lucide-react\//.test(id)) return 'vendor-icons';
            if (/node_modules\/@tanstack\//.test(id)) return 'vendor-query';
            if (/node_modules\/(zustand|immer)\//.test(id)) return 'vendor-state';
            if (/node_modules\/(socket\.io-client|engine\.io-client)\//.test(id)) return 'vendor-socket';
            return undefined;
          },
        },
      },
    },
  };
});
