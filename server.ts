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
import { createEvent, listEvents, updateEvent, eventExists, getEvent } from './server/eventsCatalog.ts';
import {
  authConfig,
  bearerToken,
  verifierKeys,
  canEditEvent,
  createFirebaseVerifier,
  ownEventPayload,
  type AuthUser,
} from './server/auth.ts';
import { buildCsp, cspHeaderName, cspMode } from './server/csp.ts';
import {
  EVENT_ID_PATTERN,
  RateLimiter,
  SECURITY_HEADERS,
  allowedModels,
  bearerMatches,
  checkChatJoin,
  checkChatSend,
  cspForPath,
  headersForPath,
  parseCalendarFeedId,
  eventsWriteMode,
  isOriginAllowed,
  isValidToolDeclaration,
  parseAllowedOrigins,
  sanitizeEventInput,
  type OriginPolicy,
} from './server/security.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const ORIGIN_POLICY: OriginPolicy = {
  allowed: parseAllowedOrigins(process.env.ALLOWED_ORIGINS),
  isProduction: IS_PRODUCTION,
};
// Firebase ID-token verification when a project id is configured (server/auth.ts).
const AUTH = authConfig(process.env);
const verifyIdToken =
  AUTH.mode === 'firebase' ? createFirebaseVerifier(AUTH.projectId as string, verifierKeys(process.env)) : null;

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
  // Socket.IO: same origin-policy as HTTP (was `origin: '*'`).
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => cb(null, isOriginAllowed(origin, undefined, ORIGIN_POLICY)),
    },
    allowRequest: (req, cb) => cb(null, isOriginAllowed(req.headers.origin, req.headers.host, ORIGIN_POLICY)),
    maxHttpBufferSize: 16_000,
  });

  app.disable('x-powered-by');
  // Honour X-Forwarded-For only when a proxy is declared (Cloudflare, Render…), so rate limits key on the real client.
  if (process.env.TRUST_PROXY) app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);

  // CSP only for the production bundle: the Vite dev server injects inline scripts for HMR.
  const CSP_HEADER = IS_PRODUCTION ? cspHeaderName(cspMode(process.env)) : null;
  const CSP_VALUE = buildCsp(process.env, { reportUri: '/api/csp-report' });
  app.use((req, res, next) => {
    // Φ27 — only the read-only organizer widget may be framed by other sites.
    for (const [k, v] of Object.entries(headersForPath(req.path, SECURITY_HEADERS))) res.setHeader(k, v);
    if (CSP_HEADER) res.setHeader(CSP_HEADER, cspForPath(CSP_VALUE, req.path));
    next();
  });

  // Browsers report CSP violations here (logged, never stored). Accepts the
  // legacy application/csp-report body and the Reporting API format.
  const cspReportLimiter = new RateLimiter(30, 60_000);
  app.post(
    '/api/csp-report',
    express.json({ type: ['application/csp-report', 'application/reports+json', 'application/json'], limit: '16kb' }),
    (req, res) => {
      if (cspReportLimiter.hit(req.ip || 'unknown') === null) {
        const body = req.body as Record<string, unknown> | unknown[];
        const report = Array.isArray(body) ? (body[0] as { body?: unknown })?.body : (body as { 'csp-report'?: unknown })?.['csp-report'];
        const r = (report ?? {}) as Record<string, unknown>;
        console.warn('CSP violation', {
          directive: r['effective-directive'] ?? r.effectiveDirective ?? r['violated-directive'],
          blocked: String(r['blocked-uri'] ?? r.blockedURL ?? '').slice(0, 200),
          page: String(r['document-uri'] ?? r.documentURL ?? '').slice(0, 200),
        });
      }
      res.sendStatus(204);
    },
  );

  app.use(express.json({ limit: '200kb' }));

  // CORS: same-origin always; cross-origin only from ALLOWED_ORIGINS (and localhost in dev).
  app.use('/api', (req, res, next) => {
    const origin = req.headers.origin;
    if (!isOriginAllowed(origin, req.headers.host, ORIGIN_POLICY)) {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // Identity: a verified Firebase user, or null. Never trusted from the body.
  app.use('/api', async (req, res, next) => {
    res.locals.user = null;
    const token = bearerToken(req.headers.authorization);
    if (token && verifyIdToken) res.locals.user = await verifyIdToken(token);
    next();
  });
  const currentUser = (res: express.Response): AuthUser | null => (res.locals.user as AuthUser | null) ?? null;

  /** With Firebase configured, AI and other personal endpoints need a verified user. */
  const requireUser: express.RequestHandler = (_req, res, next) => {
    if (!AUTH.required || currentUser(res)) return next();
    return res.status(401).json({ error: 'Sign-in required' });
  };

  const writeLimiter = new RateLimiter(parseInt(process.env.EVENTS_WRITE_LIMIT_PER_MINUTE || '20', 10), 60_000);
  const ipKey = (req: express.Request) => req.ip || req.socket.remoteAddress || 'unknown';
  /** Rate limits follow the person when known, so shared IPs do not share a budget. */
  const clientKey = (req: express.Request, res?: express.Response) => {
    const user = res ? currentUser(res) : null;
    return user ? `uid:${user.uid}` : ipKey(req);
  };

  /**
   * Event writes (audit §4 Critical):
   * 1. the service token (EVENTS_WRITE_TOKEN) for trusted back-office jobs;
   * 2. with Firebase configured, a verified non-guest user, limited to their own events;
   * 3. otherwise the previous modes: open, development, or closed.
   */
  const guardEventWrite: express.RequestHandler = (req, res, next) => {
    const serviceToken = process.env.EVENTS_WRITE_TOKEN;
    const limit = () => {
      const retry = writeLimiter.hit(clientKey(req, res));
      if (retry !== null) return res.status(429).json({ error: 'Rate limit exceeded', retryAfterMs: retry });
      next();
    };
    if (serviceToken && serviceToken.length >= 16 && bearerMatches(req.headers.authorization, serviceToken)) {
      res.locals.writer = 'service';
      return limit();
    }
    if (AUTH.mode === 'firebase') {
      const user = currentUser(res);
      if (!user) return res.status(401).json({ error: 'Sign-in required' });
      if (user.anonymous) return res.status(403).json({ error: 'Guest accounts cannot publish events' });
      res.locals.writer = 'user';
      return limit();
    }
    const mode = eventsWriteMode(process.env, IS_PRODUCTION);
    if (mode === 'closed') {
      return res.status(403).json({ error: 'Event writes are disabled on this server (set EVENTS_WRITE_TOKEN or FIREBASE_PROJECT_ID)' });
    }
    if (mode === 'token') {
      return res.status(401).json({ error: 'Missing or invalid write token' });
    }
    res.locals.writer = 'open';
    return limit();
  };

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      app: 'nakamas',
      eventsStore: 'sqlite',
      auth: AUTH.mode,
      ts: new Date().toISOString(),
    });
  });

  // The verified identity as the server sees it (role from signed custom claims).
  app.get('/api/auth/me', (_req, res) => {
    res.json({ mode: AUTH.mode, user: currentUser(res) });
  });

  // Φ27 — live organizer calendar (Luma, adapted): calendar apps poll this
  // feed; each event says whether a group is forming. Public data only.
  const icsLimiter = new RateLimiter(60, 60_000);
  app.get('/api/calendar/organizer/:file', async (req, res) => {
    const organizerId = parseCalendarFeedId(String(req.params.file));
    if (!organizerId) return res.status(404).json({ error: 'Not found' });
    if (icsLimiter.hit(ipKey(req)) !== null) return res.status(429).json({ error: 'Rate limit exceeded' });
    try {
      const [{ buildOrganizerIcs }, { mockUsers }, { mockGroups }, { mockOutingGroups }] = await Promise.all([
        import('./src/lib/organizerCalendar.ts'),
        import('./src/data/mockUsers.ts'),
        import('./src/data/mockGroups.ts'),
        import('./src/data/mockOutings.ts'),
      ]);
      const organizer = mockUsers.find((u) => u.id === organizerId);
      const name = organizerId === 'platform' ? 'Nakamas' : organizer?.name ?? organizerId;
      const origin = `${req.protocol}://${req.get('host')}`;
      const ics = buildOrganizerIcs({ id: organizerId, name }, await listEvents(), [...mockGroups, ...mockOutingGroups], origin);
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="nakamas-${organizerId}.ics"`);
      res.setHeader('Cache-Control', 'public, max-age=900');
      res.send(ics);
    } catch (err) {
      console.error('organizer calendar', err);
      res.status(500).json({ error: 'Calendar unavailable' });
    }
  });

  app.get('/api/events', async (_req, res) => {
    try {
      const events = await listEvents();
      res.json({
        events,
        source: 'api',
        count: events.length,
        ts: new Date().toISOString(),
      });
    } catch (err) {
      console.error('GET /api/events failed:', err);
      res.status(500).json({ error: 'Failed to load events catalog' });
    }
  });

  app.post('/api/events', guardEventWrite, async (req, res) => {
    try {
      const { ok, value, errors } = sanitizeEventInput(req.body, false);
      if (!ok) return res.status(400).json({ error: 'Invalid event', details: errors });
      // Client ids are kept so later PUTs line up, but may never overwrite an existing event.
      const requestedId = typeof req.body?.id === 'string' && EVENT_ID_PATTERN.test(req.body.id) ? req.body.id : undefined;
      if (requestedId && (await eventExists(requestedId))) {
        return res.status(409).json({ error: 'Event id already exists' });
      }
      const user = currentUser(res);
      const owned = res.locals.writer === 'user' && user ? ownEventPayload(user, value as Record<string, unknown>, true) : value;
      const event = await createEvent({ ...(owned as object), id: requestedId } as Parameters<typeof createEvent>[0]);
      res.status(201).json({ event, ts: new Date().toISOString() });
    } catch (err) {
      console.error('POST /api/events failed:', err);
      res.status(500).json({ error: 'Failed to create event' });
    }
  });

  app.put('/api/events/:id', guardEventWrite, async (req, res) => {
    try {
      if (!EVENT_ID_PATTERN.test(req.params.id)) return res.status(400).json({ error: 'Invalid event id' });
      const { ok, value, errors } = sanitizeEventInput(req.body, true);
      if (!ok) return res.status(400).json({ error: 'Invalid event', details: errors });
      let patch = value;
      const user = currentUser(res);
      if (res.locals.writer === 'user' && user) {
        const existing = await getEvent(req.params.id);
        if (!existing) return res.status(404).json({ error: 'Event not found' });
        if (!canEditEvent(user, existing)) return res.status(403).json({ error: 'Only the organizer or a moderator can edit this event' });
        patch = ownEventPayload(user, value as Record<string, unknown>, false);
      }
      const updated = await updateEvent(req.params.id, patch);
      if (!updated) return res.status(404).json({ error: 'Event not found' });
      res.json({ event: updated, ts: new Date().toISOString() });
    } catch (err) {
      console.error('PUT /api/events/:id failed:', err);
      res.status(500).json({ error: 'Failed to update event' });
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
  const aiLimiter = new RateLimiter(parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '30', 10), 60_000);
  // The server picks the model; clients can no longer request arbitrary ones (audit §4 High).
  const MODELS = allowedModels(process.env);
  const COPILOT_MODEL = MODELS.copilot;
  const getServerApiKey = () => {
    const key = process.env.GEMINI_API_KEY;
    return key && !key.includes('MY_GEMINI') ? key : null;
  };
  /** Returns a retry delay (ms) when the caller exceeded the per-minute budget, else null. */
  const rateLimited = (req: express.Request, res: express.Response): number | null => aiLimiter.hit(clientKey(req, res));

  // Φ23 — copilot engine discovery (never exposes the key itself).
  app.get('/api/ai/status', (_req, res) => {
    const configured = Boolean(getServerApiKey());
    res.json({ configured, model: configured ? COPILOT_MODEL : null });
  });

  // Φ23 — copilot function calling. The client sends the tool declarations,
  // the system instruction and the conversation; tools execute client-side
  // against the user's own state, so the server only relays to Gemini.
  app.post('/api/ai/copilot', requireUser, async (req, res) => {
    const retry = rateLimited(req, res);
    if (retry !== null) return res.status(429).json({ error: 'Rate limit exceeded', retryAfterMs: retry });
    const apiKey = getServerApiKey();
    if (!apiKey) return res.status(503).json({ error: 'AI proxy not configured — set GEMINI_API_KEY on the server' });

    const { system, contents, tools } = req.body ?? {};
    const size = JSON.stringify(req.body ?? {}).length;
    if (
      typeof system !== 'string' ||
      !Array.isArray(contents) ||
      contents.length === 0 ||
      contents.length > 40 ||
      !Array.isArray(tools) ||
      tools.length === 0 ||
      tools.length > 64 ||
      !tools.every(isValidToolDeclaration) ||
      !contents.every((c: unknown) => c && typeof c === 'object' && ['user', 'model'].includes((c as { role?: string }).role ?? '')) ||
      size > 120_000
    ) {
      return res.status(400).json({ error: 'Invalid copilot payload' });
    }
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: COPILOT_MODEL,
        contents,
        config: {
          systemInstruction: system.slice(0, 24_000),
          tools: [{ functionDeclarations: tools }],
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      });
      const content = response.candidates?.[0]?.content;
      const functionCalls = (response.functionCalls ?? []).map((fc) => ({ id: fc.id, name: fc.name, args: fc.args ?? {} }));
      const text = functionCalls.length ? '' : (response.text ?? '');
      return res.json({ text, functionCalls, content });
    } catch (err) {
      console.error('AI copilot error:', err);
      return res.status(502).json({ error: 'Upstream AI provider error' });
    }
  });

  // Short text helpers (event blurbs, icebreakers). Prompt only: the model and
  // generation settings are fixed server-side (was client-controlled).
  app.post('/api/ai/generate', requireUser, async (req, res) => {
    const retry = rateLimited(req, res);
    if (retry !== null) return res.status(429).json({ error: 'Rate limit exceeded', retryAfterMs: retry });

    const apiKey = getServerApiKey();
    if (!apiKey) {
      return res.status(503).json({ error: 'AI proxy not configured — set GEMINI_API_KEY on the server' });
    }

    const { prompt } = req.body ?? {};
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000) {
      return res.status(400).json({ error: '`prompt` (1–4000 characters) is required' });
    }
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: MODELS.text,
        contents: prompt,
        config: { maxOutputTokens: 300, temperature: 0.7 },
      });
      return res.json({ text: response.text ?? '' });
    } catch (err) {
      console.error('AI proxy error:', err);
      return res.status(502).json({ error: 'Upstream AI provider error' });
    }
  });

  // ── Socket.IO group chat relay (dev/mock realtime) ─────────────────────
  // Identity is fixed at connection time: a socket can no longer send as
  // someone else by changing senderId per message (audit §4 High). Without
  // real sessions the handshake id is still self-declared; see docs.
  const chatLimiter = new RateLimiter(20, 10_000);
  // With Firebase configured the socket identity is the verified uid; a
  // self-declared userId is only honoured in demo mode (no project id).
  io.use(async (socket, next) => {
    const raw = (socket.handshake.auth as { token?: unknown } | undefined)?.token;
    const verified = typeof raw === 'string' && verifyIdToken ? await verifyIdToken(raw) : null;
    if (AUTH.required && !verified) return next(new Error('unauthorized'));
    socket.data.user = verified;
    next();
  });
  io.on('connection', (socket) => {
    const verified = socket.data.user as AuthUser | null;
    const declared = (socket.handshake.auth as { userId?: unknown } | undefined)?.userId;
    const userId = verified
      ? verified.uid
      : AUTH.mode === 'off' && typeof declared === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(declared)
        ? declared
        : undefined;
    const joined = new Set<string>();

    socket.on('join_room', (conversationId: unknown) => {
      // Require a known identity; optional membership lookup can be wired when
      // Firestore memberIds writers ship (see docs/SECURITY_HARDENING.md).
      const check = checkChatJoin(conversationId, userId, joined);
      if (!check.ok) return;
      joined.add(conversationId as string);
      socket.join(conversationId as string);
    });

    socket.on('send_message', (data: unknown) => {
      // A verified socket always speaks as its uid (the client may know itself by a
      // linked demo id). Unverified demo sockets must declare their own id exactly.
      const payload =
        verified && data && typeof data === 'object' ? { ...(data as Record<string, unknown>), senderId: verified.uid } : data;
      const check = checkChatSend(payload, userId, joined);
      if (!check.ok) return;
      if (chatLimiter.hit(socket.id) !== null) return;
      const d = data as { conversationId: string; body: string };
      const msg: RealtimeMessage = {
        id: `rt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        conversationId: d.conversationId,
        senderId: userId as string,
        body: d.body.trim(),
        createdAt: new Date().toISOString(),
      };
      io.to(d.conversationId).emit('receive_message', msg);
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
