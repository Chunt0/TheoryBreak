// Server: serves the built client and stores progress JSON in a
// data directory (a Docker volume), so practice history follows you between
// browsers. Optional TLS (needed for Web MIDI/AudioWorklet off localhost) and
// optional basic auth for exposed deployments.

import { mkdir, rename, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, normalize, resolve, sep } from 'node:path';

const PORT = Number(process.env.PORT ?? 7777);
const HOST = process.env.HOST ?? '0.0.0.0';
const DIST = resolve(process.env.DIST_DIR ?? join(import.meta.dir, '../../dist'));
const DATA_DIR = resolve(process.env.DATA_DIR ?? join(import.meta.dir, '../../data'));
const STATE_FILE = join(DATA_DIR, 'state.json');
const MAX_BODY = 5 * 1024 * 1024;
const BASIC_AUTH = process.env.BASIC_AUTH ?? ''; // "user:password"
const TLS_CERT = process.env.TLS_CERT_FILE;
const TLS_KEY = process.env.TLS_KEY_FILE;

await mkdir(DATA_DIR, { recursive: true });

const SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'midi=(self), microphone=()',
  'x-frame-options': 'DENY',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...SECURITY_HEADERS } });
}

function authorized(req: Request): boolean {
  if (!BASIC_AUTH) return true;
  const h = req.headers.get('authorization') ?? '';
  if (!h.startsWith('Basic ')) return false;
  const given = Buffer.from(h.slice(6), 'base64').toString();
  // constant-time-ish comparison
  if (given.length !== BASIC_AUTH.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ BASIC_AUTH.charCodeAt(i);
  return diff === 0;
}

async function readState(): Promise<unknown> {
  try {
    return JSON.parse(await readFile(STATE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

let writing: Promise<void> = Promise.resolve();
function writeState(data: unknown): Promise<void> {
  // serialise writes; write-then-rename keeps the file intact on crashes
  writing = writing.then(async () => {
    const tmp = `${STATE_FILE}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(data));
    await rename(tmp, STATE_FILE);
  });
  return writing;
}

async function handleState(req: Request): Promise<Response> {
  if (req.method === 'GET') {
    const data = await readState();
    return json({ data });
  }
  if (req.method === 'PUT' || req.method === 'POST') {
    const len = Number(req.headers.get('content-length') ?? 0);
    if (len > MAX_BODY) return json({ error: 'too large' }, 413);
    const text = await req.text();
    if (text.length > MAX_BODY) return json({ error: 'too large' }, 413);
    let body: { data?: { updatedAt?: unknown } };
    try {
      body = JSON.parse(text);
    } catch {
      return json({ error: 'invalid json' }, 400);
    }
    if (!body || typeof body !== 'object' || !body.data || typeof body.data !== 'object') return json({ error: 'missing data' }, 400);
    const incoming = Number(body.data.updatedAt ?? 0);
    const current = (await readState()) as { updatedAt?: number } | null;
    // last-writer-wins by timestamp: never let a stale tab overwrite newer progress
    if (current && Number(current.updatedAt ?? 0) > incoming) return json({ ok: false, reason: 'stale', updatedAt: current.updatedAt }, 409);
    await writeState(body.data);
    return json({ ok: true, updatedAt: incoming });
  }
  return json({ error: 'method not allowed' }, 405);
}

async function serveStatic(req: Request, pathname: string): Promise<Response> {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  const full = resolve(DIST, rel || 'index.html');
  if (full !== DIST && !full.startsWith(DIST + sep)) return new Response('Not found', { status: 404 });
  let file = Bun.file(full);
  if (!(await file.exists()) || rel === '') file = Bun.file(join(DIST, 'index.html'));
  if (!(await file.exists())) return new Response('Client not built. Run `bun run build`.', { status: 503 });
  // Bundles keep fixed names (main.js, dx7-processor.js), so every file is
  // revalidated: an updated image never runs yesterday's JS with today's HTML.
  const etag = `W/"${file.size.toString(36)}-${file.lastModified.toString(36)}"`;
  const headers: Record<string, string> = { 'cache-control': 'no-cache', etag, ...SECURITY_HEADERS };
  if (full.endsWith('.webmanifest')) headers['content-type'] = 'application/manifest+json';
  if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  return new Response(file, { headers });
}

const server = Bun.serve({
  port: PORT,
  hostname: HOST,
  ...(TLS_CERT && TLS_KEY && existsSync(TLS_CERT) && existsSync(TLS_KEY) ? { tls: { cert: Bun.file(TLS_CERT), key: Bun.file(TLS_KEY) } } : {}),
  async fetch(req) {
    if (!authorized(req)) {
      return new Response('Authentication required', { status: 401, headers: { 'www-authenticate': 'Basic realm="Music theory practice"' } });
    }
    const url = new URL(req.url);
    if (url.pathname === '/api/health') return json({ ok: true });
    if (url.pathname === '/api/state') return handleState(req);
    if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    return serveStatic(req, url.pathname);
  },
  error(err) {
    console.error(err);
    return new Response('Internal error', { status: 500 });
  },
});

console.log(`Listening on ${server.url} (data: ${DATA_DIR})`);
