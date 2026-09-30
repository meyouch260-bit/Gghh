import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * En local, sert /api/generate directement depuis Vite (même code que la
 * fonction Vercel), pour que `npm run dev` suffise.
 */
function devApi(): Plugin {
  return {
    name: 'dev-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      for (const [k, v] of Object.entries(env)) {
        if (k.startsWith('ANTHROPIC_') && !process.env[k]) process.env[k] = v;
      }
      server.middlewares.use('/api/generate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        let raw = '';
        for await (const chunk of req) raw += chunk;
        const { handleGenerate } = await server.ssrLoadModule('/server/generate.ts');
        let body: unknown = null;
        try {
          body = JSON.parse(raw);
        } catch {
          /* handled by handleGenerate */
        }
        const out = await handleGenerate(body);
        res.statusCode = out.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(out.body));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devApi()],
  server: { host: true },
});
