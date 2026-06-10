/**
 * Nakamas dev/production server — Express + Vite + Socket.IO + AI proxy.
 * Pattern adapted from CoFounderBay production shell.
 */
import express from 'express';
import path from 'path';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);

interface RealtimeMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, { cors: { origin: '*' } });

  app.use(express.json({ limit: '1mb' }));

  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  app.options('*', (_req, res) => res.sendStatus(200));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, app: 'nakamas', ts: new Date().toISOString() });
  });

  app.get('/api/events', async (_req, res) => {
    try {
      const { mockEvents } = await import('./src/data/mockEvents.ts');
      const { mockCalendarPlanEvents } = await import('./src/data/mockCalendarPlan.ts');
      res.json({
        events: [...mockEvents, ...mockCalendarPlanEvents],
        source: 'api',
        count: mockEvents.length + mockCalendarPlanEvents.length,
        ts: new Date().toISOString(),
      });
    } catch (err) {
      console.error('GET /api/events failed:', err);
      res.status(500).json({ error: 'Failed to load events catalog' });
    }
  });

  app.get('/api/notifications', async (_req, res) => {
    try {
      const { mockNotifications } = await import('./src/data/mockNotifications.ts');
      res.json({ notifications: mockNotifications, ts: new Date().toISOString() });
    } catch (err) {
      console.error('GET /api/notifications failed:', err);
      res.status(500).json({ error: 'Failed to load notifications' });
    }
  });

  // ── AI Proxy (keeps GEMINI_API_KEY server-side) ─────────────────────────
  const aiRateBuckets = new Map<string, { count: number; resetAt: number }>();
  const AI_RATE_LIMIT = parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '30', 10);

  app.post('/api/ai/generate', async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = aiRateBuckets.get(ip);
    if (!bucket || bucket.resetAt < now) {
      aiRateBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    } else if (++bucket.count > AI_RATE_LIMIT) {
      return res.status(429).json({ error: 'Rate limit exceeded', retryAfterMs: bucket.resetAt - now });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('MY_GEMINI')) {
      return res.status(503).json({ error: 'AI proxy not configured — set GEMINI_API_KEY on the server' });
    }

    const { model, contents, config, prompt } = req.body ?? {};
    if (prompt && typeof prompt === 'string') {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: model || 'gemini-2.0-flash',
          contents: prompt,
          config: config ?? { maxOutputTokens: 256, temperature: 0.7 },
        });
        return res.json({ text: response.text ?? '' });
      } catch (err) {
        console.error('AI proxy error:', err);
        return res.status(502).json({ error: 'Upstream AI provider error' });
      }
    }

    if (typeof model !== 'string' || contents === undefined) {
      return res.status(400).json({ error: '`prompt` or (`model` + `contents`) required' });
    }

    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ model, contents, config });
      return res.json({ text: response.text ?? '' });
    } catch (err) {
      console.error('AI proxy error:', err);
      return res.status(502).json({ error: 'Upstream AI provider error' });
    }
  });

  // ── Socket.IO group chat relay (dev/mock realtime) ─────────────────────
  io.on('connection', (socket) => {
    socket.on('join_room', (conversationId: string) => {
      if (typeof conversationId === 'string') socket.join(conversationId);
    });

    socket.on('send_message', (data: { conversationId: string; senderId: string; body: string }) => {
      if (!data?.conversationId || !data?.senderId || !data?.body) return;
      const msg: RealtimeMessage = {
        id: `rt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        conversationId: data.conversationId,
        senderId: data.senderId,
        body: data.body,
        createdAt: new Date().toISOString(),
      };
      io.to(data.conversationId).emit('receive_message', msg);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Nakamas server http://localhost:${PORT} (API + WS + Vite)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
