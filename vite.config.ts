import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { neon } from '@neondatabase/serverless';
import { onRequestGet as getSantri, onRequestPost as postSantri } from './functions/api/santri';
import { onRequestGet as getPenilaian, onRequestPost as postPenilaian } from './functions/api/penilaian';
import { onRequestGet as getPenguji, onRequestPost as postPenguji } from './functions/api/penguji';
import { onRequestGet as getPengajar, onRequestPost as postPengajar } from './functions/api/pengajar';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'neon-api-dev-server',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith('/api/')) {
              return next();
            }

            try {
              const fullUrl = `http://${req.headers.host}${req.url}`;
              const url = new URL(fullUrl);
              const path = url.pathname;
              const method = req.method || 'GET';

              let bodyData: any = undefined;
              if (method === 'POST' || method === 'PUT') {
                const buffers: any[] = [];
                for await (const chunk of req) {
                  buffers.push(chunk);
                }
                const raw = Buffer.concat(buffers).toString();
                if (raw) {
                  try {
                    bodyData = JSON.parse(raw);
                  } catch {
                    bodyData = raw;
                  }
                }
              }

              const fakeRequest = new Request(fullUrl, {
                method,
                headers: req.headers as any,
                body: bodyData ? JSON.stringify(bodyData) : undefined,
              });

              const context = {
                request: fakeRequest,
                env: { DATABASE_URL: env.DATABASE_URL },
              };

              let response: Response;

              if (path === '/api/santri') {
                response = method === 'POST' ? await postSantri(context) : await getSantri(context);
              } else if (path === '/api/penilaian') {
                response = method === 'POST' ? await postPenilaian(context) : await getPenilaian(context);
              } else if (path === '/api/penguji') {
                response = method === 'POST' ? await postPenguji(context) : await getPenguji(context);
              } else if (path === '/api/pengajar') {
                response = method === 'POST' ? await postPengajar(context) : await getPengajar(context);
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Endpoint tidak ditemukan' }));
                return;
              }

              res.statusCode = response.status;
              response.headers.forEach((val, key) => {
                res.setHeader(key, val);
              });
              const text = await response.text();
              res.end(text);
            } catch (err: any) {
              console.error('API Dev Error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        },
      },
    ],
  };
});
