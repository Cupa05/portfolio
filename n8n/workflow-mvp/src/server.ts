import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Workflow } from './types.js';
import { runWorkflowOnce } from './engine/execute.js';
import { getNextNodeIdsFromTrigger, scheduleWorkflow } from './scheduler.js';

dotenv.config();

const app = express();
app.use(express.json());

// In-memory sessions (MVP)
const sessions = new Map<string, { username: string; createdAt: number }>();

function parseCookies(cookieHeader: string | undefined) {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(';');
  for (const p of parts) {
    const [k, ...v] = p.trim().split('=');
    out[k] = decodeURIComponent(v.join('='));
  }
  return out;
}

function loadWorkflowByName(name: string): Workflow {
  const p = path.resolve(process.cwd(), 'examples', `${name}.json`);
  const raw = fs.readFileSync(p, 'utf-8');
  return JSON.parse(raw);
}

app.get('/health', (_req, res) => res.json({ ok: true }));

function circularReplacer() {
  const seen = new WeakSet();
  return (_key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return undefined;
      seen.add(value);
    }
    return value;
  };
}

// List available workflows from examples directory
app.get('/workflows', (_req, res) => {
  const cookies = parseCookies(_req.headers.cookie);
  const sid = cookies['sid'];
  if (!(sid && sessions.has(sid))) return res.status(401).json({ error: 'Unauthorized' });
  const examplesDir = path.resolve(process.cwd(), 'examples');
  if (!fs.existsSync(examplesDir)) return res.json([]);
  const files = fs.readdirSync(examplesDir).filter((f) => f.endsWith('.json'));
  return res.json(files.map((f) => f.replace(/\.json$/i, '')));
});

// Get workflow JSON by name
app.get('/workflows/:name', (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const sid = cookies['sid'];
    if (!(sid && sessions.has(sid))) return res.status(401).json({ error: 'Unauthorized' });
    const wf = loadWorkflowByName(req.params.name);
    res.json(wf);
  } catch (e: any) {
    res.status(404).json({ error: e?.message || 'Not found' });
  }
});

// Save/overwrite workflow JSON by name
app.put('/workflows/:name', (req, res) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const sid = cookies['sid'];
    if (!(sid && sessions.has(sid))) return res.status(401).json({ error: 'Unauthorized' });
    const name = req.params.name;
    const data = req.body;
    const examplesDir = path.resolve(process.cwd(), 'examples');
    if (!fs.existsSync(examplesDir)) fs.mkdirSync(examplesDir, { recursive: true });
    const p = path.join(examplesDir, `${name}.json`);
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'Failed to save' });
  }
});

app.post('/webhook/:workflow/:triggerId', async (req, res) => {
  try {
    const { workflow: wfName, triggerId } = req.params;
    const wf = loadWorkflowByName(wfName);

    const runId = crypto.randomUUID();
    const ctx = {
      runId,
      triggerId,
      now: new Date().toISOString(),
      headers: req.headers,
      query: req.query,
      body: req.body,
      result: {}
    };

    const startIds = getNextNodeIdsFromTrigger(wf, triggerId, 'main');
    if (!startIds.length) return res.status(400).json({ error: 'No connections from trigger' });

    const out = await runWorkflowOnce(wf, startIds, ctx as any);
    const safeResult = JSON.parse(JSON.stringify(out.result, circularReplacer()));
    res.json({ runId, result: safeResult });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Local echo endpoint for testing HTTP requests without external network
app.all('/echo', (req, res) => {
  res.json({
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body
  });
});

// Auth endpoints
app.post('/login', (req, res) => {
  const { username: rawUsername, email, password } = (req.body || {}) as { username?: string; email?: string; password?: string };
  const username = rawUsername || email;
  if (username === 'admin' && password === 'admin') {
    const sid = crypto.randomUUID();
    sessions.set(sid, { username: 'admin', createdAt: Date.now() });
    res.setHeader('Set-Cookie', `sid=${encodeURIComponent(sid)}; HttpOnly; Path=/; SameSite=Lax`);
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid credentials' });
});

app.post('/logout', (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies['sid'];
  if (sid) sessions.delete(sid);
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  res.json({ ok: true });
});

// Auth middleware: protect UI and workflow management
const allowlist: Array<(req: express.Request) => boolean> = [
  (req) => req.path.startsWith('/health'),
  (req) => req.path.startsWith('/echo'),
  (req) => req.path.startsWith('/webhook/'),
  (req) => req.path.startsWith('/login'),
  (req) => req.path === '/favicon.ico'
];

app.use((req, res, next) => {
  if (allowlist.some((fn) => fn(req))) return next();
  const cookies = parseCookies(req.headers.cookie);
  const sid = cookies['sid'];
  if (sid && sessions.has(sid)) return next();
  // If HTML request, redirect to login page, else 401
  const acceptsHtml = (req.headers.accept || '').includes('text/html');
  if (acceptsHtml && req.method === 'GET') return res.redirect('/login');
  return res.status(401).json({ error: 'Unauthorized' });
});

function startCron() {
  // Load all example workflows and schedule cron triggers if any
  const examplesDir = path.resolve(process.cwd(), 'examples');
  if (!fs.existsSync(examplesDir)) return;
  const files = fs.readdirSync(examplesDir).filter((f) => f.endsWith('.json'));
  for (const f of files) {
    const wf: Workflow = JSON.parse(fs.readFileSync(path.join(examplesDir, f), 'utf-8'));
    scheduleWorkflow(wf);
  }
}

// Serve minimal UI from public/
const publicDir = path.resolve(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  // Serve login page without auth at /login
  app.get('/login', (_req, res) => {
    res.sendFile(path.join(publicDir, 'login.html'));
  });
  // Serve other static assets (index.html, app.js, style.css) behind auth
  app.use(express.static(publicDir));
}

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  startCron();
  console.log(`Workflow server listening on http://localhost:${port}`);
  if (fs.existsSync(publicDir)) {
    console.log(`UI available at http://localhost:${port}/`);
  }
});
