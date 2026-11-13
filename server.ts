import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import postgres from 'postgres';

const scrypt = promisify(scryptCallback);
const PORT = Number(process.env.PORT || 3000);
const HOST = '0.0.0.0';
const SESSION_COOKIE = 'arms_session';
const SESSION_SECONDS = 60 * 60 * 12;
const LOCAL_DB_PATH = path.resolve(process.cwd(), '.arms-local-db.json');
const DUMMY_HASH = `${'00'.repeat(16)}:${'00'.repeat(64)}`;

type Role = 'System Admin' | 'Archive Manager' | 'Data Entry' | 'Viewer';

interface LocalUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  password_hash: string;
  last_login: string | null;
  created_at: string;
}

interface LocalDb {
  revision: number;
  users: LocalUser[];
  boxes: any[];
  dossiers: any[];
  projects: any[];
  uploadHistory: any[];
  notifications: any[];
  auditLogs: any[];
  loginAttempts: Record<string, { attempts: number; lockedUntil: number | null }>;
}

interface SessionPayload {
  sub: string;
  username: string;
  iat: number;
  exp: number;
}

let fallbackSecret: string | null = null;
function sessionSecret(): string {
  const value = process.env.ARMS_SESSION_SECRET;
  if (value && value.length >= 32) return value;
  if (!fallbackSecret) fallbackSecret = randomBytes(32).toString('hex');
  return fallbackSecret;
}

function signToken(value: string): string {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

function createSession(user: { id: string; username: string }) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { sub: user.id, username: user.username, iat: now, exp: now + SESSION_SECONDS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return { value: `${encoded}.${signToken(encoded)}`, maxAge: SESSION_SECONDS };
}

function readSession(req: express.Request): SessionPayload | null {
  try {
    const raw = req.headers.cookie || '';
    let token = '';
    for (const part of raw.split(';')) {
      const [k, ...rest] = part.trim().split('=');
      if (k === SESSION_COOKIE) {
        token = decodeURIComponent(rest.join('='));
        break;
      }
    }
    if (!token) {
      const authHeader = String(req.headers.authorization || '').trim();
      const match = /^Bearer\s+(.+)$/i.exec(authHeader);
      if (match) token = match[1].trim();
    }
    const [encoded, supplied] = token.split('.');
    if (!encoded || !supplied) return null;
    const expected = Buffer.from(signToken(encoded));
    const actual = Buffer.from(supplied);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.sub || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function setSessionCookie(req: express.Request, res: express.Response, value: string, maxAge: number) {
  const proto = String(req.headers['x-forwarded-proto'] || '');
  const isHttps = req.secure || proto.toLowerCase().includes('https');
  const attrs = isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax';
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; ${attrs}; Max-Age=${maxAge}`
  );
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString('hex')}:${key.toString('hex')}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, keyHex] = (stored || '').split(':');
  if (!saltHex || !keyHex) return false;
  const key = (await scrypt(password, Buffer.from(saltHex, 'hex'), 64)) as Buffer;
  const expected = Buffer.from(keyHex, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected);
}

const safeUser = (u: any) => ({
  id: u.id,
  username: u.username,
  email: u.email || '',
  name: u.name,
  role: u.role,
  active: u.active,
  lastLogin: u.last_login || 'Never',
});

function databaseUrl(): string {
  const strip = (v: string) => v.trim().replace(/^['"]+|['"]+$/g, '').trim();
  let value = strip(process.env.DATABASE_URL || '');
  value = strip(value.replace(/^psql\s+/i, ''));
  return value;
}

let pgClient: ReturnType<typeof postgres> | null = null;
let pgUrl = '';
function getSql() {
  const url = databaseUrl();
  if (!url) return null;
  if (!pgClient || pgUrl !== url) {
    pgClient = postgres(url, {
      ssl: 'require',
      prepare: false,
      fetch_types: false,
      max: 6,
      idle_timeout: 20,
      connect_timeout: 15,
    });
    pgUrl = url;
  }
  return pgClient;
}

// ---- Local JSON store (used automatically when DATABASE_URL is not configured) ----

let localDbCache: LocalDb | null = null;

async function getLocalDb(): Promise<LocalDb> {
  if (!localDbCache) {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      try {
        localDbCache = JSON.parse(fs.readFileSync(LOCAL_DB_PATH, 'utf8')) as LocalDb;
      } catch {
        localDbCache = null;
      }
    }
    if (!localDbCache) {
      localDbCache = {
        revision: 0,
        users: [],
        boxes: [],
        dossiers: [],
        projects: [],
        uploadHistory: [],
        notifications: [],
        auditLogs: [],
        loginAttempts: {},
      };
    }
  }

  if (localDbCache.users.length === 0) {
    const username = (process.env.ARMS_ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const password = process.env.ARMS_ADMIN_PASSWORD || '1234';
    const name = (process.env.ARMS_ADMIN_NAME || 'System Administrator').trim();
    localDbCache.users.push({
      id: `usr_${randomBytes(16).toString('hex')}`,
      username,
      email: 'admin@intercom.local',
      name,
      role: 'System Admin',
      active: true,
      password_hash: await hashPassword(password),
      last_login: null,
      created_at: new Date().toISOString(),
    });
    saveLocalDb(localDbCache);
  }
  return localDbCache;
}

function saveLocalDb(db: LocalDb) {
  localDbCache = db;
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db), 'utf8');
  } catch (err) {
    console.error('Failed persisting local ARMS store:', err);
  }
}

function validateStatePayload(parsed: any): { error?: string; state?: any } {
  const requiredArrays = ['boxes', 'dossiers', 'projects', 'uploadHistory', 'notifications', 'auditLogs'];
  if (requiredArrays.some(key => !Array.isArray(parsed?.[key]))) {
    return { error: 'Invalid archive state payload.' };
  }
  const state = {
    boxes: parsed.boxes,
    dossiers: parsed.dossiers,
    projects: parsed.projects,
    uploadHistory: parsed.uploadHistory,
    notifications: parsed.notifications,
    auditLogs: parsed.auditLogs,
  };
  const expectedBox = (boxCode: string, firstJobId: number) => {
    const match = /^D(\d+)$/.exec(boxCode || '');
    if (!match || !Number.isInteger(firstJobId) || firstJobId < 35500 || (firstJobId - 35500) % 300 !== 0) {
      return false;
    }
    return Number(match[1]) === 42 + (firstJobId - 35500) / 300;
  };
  const boxCodes = new Set(state.boxes.filter((b: any) => b && typeof b.boxCode === 'string').map((b: any) => b.boxCode));
  if (
    boxCodes.size !== state.boxes.length ||
    state.boxes.some((b: any) => !b || !expectedBox(b.boxCode, b.firstJobId) || b.lastJobId !== b.firstJobId + 299)
  ) {
    return { error: 'Invalid box range. D42 must start at 35500 and each box contains exactly 300 consecutive IDs.' };
  }
  for (const b of state.boxes as any[]) {
    const n = Number(String(b.boxCode).slice(1));
    if (n > 42 && !boxCodes.has(`D${n - 1}`)) {
      return { error: `Missing previous box D${n - 1}; box sequence cannot skip.` };
    }
  }
  const seenIds = new Set<number>();
  for (const p of state.projects as any[]) {
    if (!p || !Number.isInteger(p.jobId) || p.jobId < 35500 || !['Archived', 'Missing', 'Pending'].includes(p.status)) {
      return { error: 'Invalid project record.' };
    }
    const index = Math.floor((p.jobId - 35500) / 300);
    const expectedCode = `D${42 + index}`;
    const expectedDossier = Math.floor(((p.jobId - 35500) % 300) / 50) + 1;
    if (
      !p ||
      p.boxId !== expectedCode ||
      p.dossierNumber !== expectedDossier ||
      p.slotIndex !== (p.jobId - 35500) % 50 ||
      !boxCodes.has(expectedCode) ||
      seenIds.has(p.jobId)
    ) {
      return { error: `Project ${p.jobId} does not match its fixed box/dossier slot.` };
    }
    seenIds.add(p.jobId);
  }
  const dossierIds = new Set<string>();
  for (const d of state.dossiers as any[]) {
    if (
      !d ||
      !d.id ||
      d.id !== `${d.boxId}-${d.dossierNumber}` ||
      !boxCodes.has(d.boxId) ||
      !Number.isInteger(d.dossierNumber) ||
      d.dossierNumber < 1 ||
      d.dossierNumber > 6 ||
      dossierIds.has(d.id)
    ) {
      return { error: 'Invalid dossier-to-box relationship.' };
    }
    dossierIds.add(d.id);
  }
  if ([...state.uploadHistory, ...state.notifications, ...state.auditLogs].some((r: any) => !r || typeof r.id !== 'string' || !r.id)) {
    return { error: 'Invalid history or notification record.' };
  }
  for (const b of state.boxes as any[]) {
    const count = (state.projects as any[]).filter(p => p.boxId === b.boxCode).length;
    const dossierCount = (state.dossiers as any[]).filter(d => d.boxId === b.boxCode).length;
    if (count !== 300 || dossierCount !== 6) {
      return { error: `Box ${b.boxCode} must contain exactly 300 project slots and 6 dossiers.` };
    }
  }
  return { state };
}

function describePgError(error: unknown, fallback = 'Database operation failed.') {
  const err = error as { code?: string; message?: string; name?: string };
  const message = String(err?.message || '');
  const code = String(err?.code || err?.name || 'UNKNOWN');
  if (code === 'QUERY_TIMEOUT') return { status: 504, code, error: 'استغرق الاستعلام وقتاً أطول من المسموح.' };
  if (['42P01', '42883', '42703', '42P10'].includes(code)) {
    return { status: 503, code, error: 'قاعدة البيانات غير مهيأة: شغّل scripts/schema.sql أولاً.' };
  }
  return { status: 500, code, error: fallback, detail: message.slice(0, 180) };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // ---- /api/health ----
  app.get('/api/health', async (_req, res) => {
    const sql = getSql();
    if (!sql) {
      const db = await getLocalDb();
      return res.json({ mode: 'local', database: 'ok', users: db.users.length, boxes: db.boxes.length });
    }
    try {
      const t0 = Date.now();
      await sql`SELECT 1`;
      const tables = await sql`SELECT to_regclass('public.arms_users') IS NOT NULL AS users, to_regclass('public.arms_app_state') IS NOT NULL AS state`;
      return res.json({ mode: 'postgres', database: 'ok', pingMs: Date.now() - t0, schema: tables[0] });
    } catch (error) {
      const info = describePgError(error);
      return res.status(info.status).json({ mode: 'postgres', database: 'error', ...info });
    }
  });

  // ---- /api/auth ----
  app.all('/api/auth', async (req, res) => {
    try {
      const body = req.method === 'POST' ? (req.body || {}) : {};
      if (body.action === 'logout') {
        setSessionCookie(req, res, '', 0);
        return res.status(200).json({ ok: true });
      }

      const sql = getSql();
      if (!sql) {
        const db = await getLocalDb();
        if (req.method === 'GET') {
          const session = readSession(req);
          if (!session) return res.json({ user: null, setupRequired: db.users.length === 0, storageMode: 'local' });
          const u = db.users.find(x => x.id === session.sub);
          if (!u || !u.active) return res.json({ user: null, setupRequired: false, storageMode: 'local' });
          return res.json({ user: safeUser(u), setupRequired: false, storageMode: 'local' });
        }
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

        if (body.action === 'change-password') {
          const session = readSession(req);
          if (!session) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً.' });
          const { currentPassword, newPassword } = body;
          if (typeof newPassword !== 'string' || newPassword.length < 1 || newPassword.length > 256) {
            return res.status(400).json({ error: 'يرجى إدخال كلمة مرور جديدة صالحة.' });
          }
          const u = db.users.find(x => x.id === session.sub && x.active);
          if (!u || !(await verifyPassword(String(currentPassword || ''), u.password_hash))) {
            return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
          }
          u.password_hash = await hashPassword(newPassword);
          saveLocalDb(db);
          return res.json({ ok: true });
        }

        if (body.action === 'login') {
          const username = String(body.username || '').trim().toLowerCase();
          const password = String(body.password || '');
          if (!username || username.length > 80 || !password || password.length > 256) {
            return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم وكلمة المرور.' });
          }
          const u = db.users.find(x => x.username === username);
          const valid = await verifyPassword(password, u?.password_hash || DUMMY_HASH);
          if (!u || !u.active || !valid) {
            return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
          }
          u.last_login = new Date().toISOString();
          saveLocalDb(db);
          const session = createSession({ id: u.id, username: u.username });
          setSessionCookie(req, res, session.value, session.maxAge);
          return res.json({ user: safeUser(u), storageMode: 'local', sessionToken: session.value });
        }

        return res.status(400).json({ error: 'Unknown authentication action.' });
      }

      // PostgreSQL path
      if (process.env.ARMS_ADMIN_USERNAME && process.env.ARMS_ADMIN_PASSWORD) {
        const envUser = process.env.ARMS_ADMIN_USERNAME.trim().toLowerCase();
        const envPass = process.env.ARMS_ADMIN_PASSWORD;
        if (envUser && envUser.length <= 80 && envPass.length >= 1 && envPass.length <= 256) {
          const exists = await sql`SELECT 1 FROM arms_users WHERE username = ${envUser} LIMIT 1`;
          if (exists.length === 0) {
            const envId = `usr_${randomBytes(16).toString('hex')}`;
            const envHash = await hashPassword(envPass);
            const envName = (process.env.ARMS_ADMIN_NAME || 'System Administrator').trim().slice(0, 120);
            await sql`INSERT INTO arms_users (id, username, email, name, role, active, password_hash)
              VALUES (${envId}, ${envUser}, '', ${envName}, 'System Admin', TRUE, ${envHash})
              ON CONFLICT (username) DO NOTHING`;
          }
        }
      }
      if (req.method === 'GET') {
        const session = readSession(req);
        if (!session) {
          const count = await sql`SELECT COUNT(*)::int AS count FROM arms_users`;
          return res.json({ user: null, setupRequired: count[0].count === 0, storageMode: 'postgres' });
        }
        const rows = await sql`SELECT id, username, email, name, role, active, last_login FROM arms_users WHERE id = ${session.sub} LIMIT 1`;
        if (!rows[0] || !rows[0].active) return res.json({ user: null, setupRequired: false, storageMode: 'postgres' });
        return res.json({ user: safeUser(rows[0]), setupRequired: false, storageMode: 'postgres' });
      }
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

      if (body.action === 'setup') {
        const setupSecret = process.env.ARMS_SETUP_SECRET;
        if (!setupSecret || body.setupSecret !== setupSecret) {
          return res.status(403).json({ error: 'Invalid initial setup key.' });
        }
        const count = await sql`SELECT COUNT(*)::int AS count FROM arms_users`;
        if (count[0].count !== 0) return res.status(409).json({ error: 'Initial setup has already been completed.' });
        const { username, name, email = '', password } = body;
        if (!username || !name || typeof password !== 'string' || password.length < 1 || password.length > 256) {
          return res.status(400).json({ error: 'أدخل اسم المستخدم والاسم الكامل وكلمة المرور.' });
        }
        const id = `usr_${randomBytes(16).toString('hex')}`;
        const passwordHash = await hashPassword(password);
        const inserted = await sql`INSERT INTO arms_users (id, username, email, name, role, active, password_hash, last_login)
          VALUES (${id}, ${String(username).trim().toLowerCase()}, ${String(email).trim()}, ${String(name).trim()}, 'System Admin', TRUE, ${passwordHash}, NOW())
          RETURNING id, username, email, name, role, active, last_login`;
        const session = createSession({ id, username: inserted[0].username });
        setSessionCookie(req, res, session.value, session.maxAge);
        return res.status(201).json({ user: safeUser(inserted[0]), storageMode: 'postgres', sessionToken: session.value });
      }

      if (body.action === 'change-password') {
        const session = readSession(req);
        if (!session) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً.' });
        const { currentPassword, newPassword } = body;
        if (typeof newPassword !== 'string' || newPassword.length < 1 || newPassword.length > 256) {
          return res.status(400).json({ error: 'يرجى إدخال كلمة مرور جديدة صالحة.' });
        }
        const rows = await sql`SELECT password_hash FROM arms_users WHERE id = ${session.sub} AND active = TRUE LIMIT 1`;
        if (!rows[0] || !(await verifyPassword(String(currentPassword || ''), rows[0].password_hash))) {
          return res.status(401).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
        }
        const passwordHash = await hashPassword(newPassword);
        await sql`UPDATE arms_users SET password_hash = ${passwordHash}, updated_at = NOW() WHERE id = ${session.sub}`;
        return res.json({ ok: true });
      }

      if (body.action === 'login') {
        const username = String(body.username || '').trim().toLowerCase();
        const password = String(body.password || '');
        if (!username || username.length > 80 || !password || password.length > 256) {
          return res.status(400).json({ error: 'بيانات الدخول غير صالحة.' });
        }
        const rows = await sql`SELECT id, username, email, name, role, active, password_hash FROM arms_users WHERE username = ${username} LIMIT 1`;
        const user = rows[0];
        const valid = await verifyPassword(password, user?.password_hash || DUMMY_HASH);
        if (!user || !user.active || !valid) {
          return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
        }
        const updated = await sql`UPDATE arms_users SET last_login = NOW() WHERE id = ${user.id} RETURNING id, username, email, name, role, active, last_login`;
        const session = createSession({ id: user.id, username: user.username });
        setSessionCookie(req, res, session.value, session.maxAge);
        return res.json({ user: safeUser(updated[0]), storageMode: 'postgres', sessionToken: session.value });
      }

      return res.status(400).json({ error: 'Unknown authentication action.' });
    } catch (error) {
      const info = describePgError(error, 'Authentication failed.');
      return res.status(info.status).json(info);
    }
  });

  // ---- /api/users ----
  app.all('/api/users', async (req, res) => {
    const session = readSession(req);
    if (!session) return res.status(401).json({ error: 'Unauthorized.' });
    try {
      const sql = getSql();
      if (!sql) {
        const db = await getLocalDb();
        const actor = db.users.find(u => u.id === session.sub);
        if (!actor?.active || actor.role !== 'System Admin') {
          return res.status(403).json({ error: 'System Admin permission required.' });
        }
        if (req.method === 'GET') return res.json({ users: db.users.map(safeUser) });
        if (req.method === 'POST') {
          const { username, name, email = '', role, password } = req.body || {};
          if (!username || !name || !['System Admin', 'Archive Manager', 'Data Entry', 'Viewer'].includes(role) || typeof password !== 'string' || password.length < 1) {
            return res.status(400).json({ error: 'مطلوب اسم المستخدم والاسم الكامل والدور وكلمة المرور.' });
          }
          const normalized = String(username).trim().toLowerCase();
          if (db.users.some(u => u.username === normalized)) {
            return res.status(409).json({ error: 'اسم المستخدم مستخدم بالفعل.' });
          }
          const created: LocalUser = {
            id: `usr_${randomBytes(16).toString('hex')}`,
            username: normalized,
            email: String(email).trim(),
            name: String(name).trim(),
            role,
            active: true,
            password_hash: await hashPassword(password),
            last_login: null,
            created_at: new Date().toISOString(),
          };
          db.users.push(created);
          saveLocalDb(db);
          return res.status(201).json({ user: safeUser(created) });
        }
        if (req.method === 'PATCH') {
          const { id, role, active } = req.body || {};
          const target = db.users.find(u => u.id === id);
          if (!target) return res.status(404).json({ error: 'User not found.' });
          if (id === session.sub && active === false) return res.status(400).json({ error: 'You cannot deactivate your own account.' });
          if (id === session.sub && role && role !== 'System Admin') return res.status(400).json({ error: 'You cannot lower your own administrator role.' });
          if (role !== undefined && ['System Admin', 'Archive Manager', 'Data Entry', 'Viewer'].includes(role)) target.role = role;
          if (active !== undefined && typeof active === 'boolean') target.active = active;
          saveLocalDb(db);
          return res.json({ user: safeUser(target) });
        }
        return res.status(405).json({ error: 'Method not allowed.' });
      }

      const current = await sql`SELECT role, active FROM arms_users WHERE id = ${session.sub} LIMIT 1`;
      if (!current[0]?.active || current[0].role !== 'System Admin') {
        return res.status(403).json({ error: 'System Admin permission required.' });
      }
      if (req.method === 'GET') {
        const rows = await sql`SELECT id, username, email, name, role, active, last_login FROM arms_users ORDER BY created_at ASC`;
        return res.json({ users: rows.map(safeUser) });
      }
      if (req.method === 'POST') {
        const { username, name, email = '', role, password } = req.body || {};
        if (!username || !name || !['System Admin', 'Archive Manager', 'Data Entry', 'Viewer'].includes(role) || typeof password !== 'string' || password.length < 1) {
          return res.status(400).json({ error: 'مطلوب اسم المستخدم والاسم الكامل والدور وكلمة المرور.' });
        }
        const id = `usr_${randomBytes(16).toString('hex')}`;
        const passwordHash = await hashPassword(password);
        const rows = await sql`INSERT INTO arms_users (id, username, email, name, role, active, password_hash)
          VALUES (${id}, ${String(username).trim().toLowerCase()}, ${String(email).trim()}, ${String(name).trim()}, ${role}, TRUE, ${passwordHash})
          RETURNING id, username, email, name, role, active, last_login`;
        return res.status(201).json({ user: safeUser(rows[0]) });
      }
      if (req.method === 'PATCH') {
        const { id, role, active } = req.body || {};
        if (!id) return res.status(400).json({ error: 'Invalid user update.' });
        if (id === session.sub && active === false) return res.status(400).json({ error: 'You cannot deactivate your own account.' });
        if (id === session.sub && role && role !== 'System Admin') return res.status(400).json({ error: 'You cannot lower your own administrator role.' });
        const rows = await sql`UPDATE arms_users SET role = COALESCE(${role ?? null}, role), active = COALESCE(${active ?? null}, active), updated_at = NOW() WHERE id = ${id} RETURNING id, username, email, name, role, active, last_login`;
        if (!rows.length) return res.status(404).json({ error: 'User not found.' });
        return res.json({ user: safeUser(rows[0]) });
      }
      return res.status(405).json({ error: 'Method not allowed.' });
    } catch (error: any) {
      if (error?.code === '23505') return res.status(409).json({ error: 'اسم المستخدم مستخدم بالفعل.' });
      const info = describePgError(error);
      return res.status(info.status).json(info);
    }
  });

  // ---- /api/state ----
  app.all('/api/state', async (req, res) => {
    const session = readSession(req);
    if (!session) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً.' });

    try {
      const sql = getSql();
      if (!sql) {
        const db = await getLocalDb();
        const user = db.users.find(u => u.id === session.sub);
        if (!user || !user.active) return res.status(401).json({ error: 'الحساب غير نشط أو لم يعد موجوداً.' });

        if (req.method === 'GET') {
          const part = String(req.query.part || 'core');
          if (part === 'projects' || part === 'audit') {
            const limit = Math.max(1, Math.min(3000, Number(req.query.limit || 1000)));
            const offset = Math.max(0, Number(req.query.offset || 0));
            const list = part === 'projects' ? db.projects : db.auditLogs;
            return res.json({ _revision: db.revision, items: list.slice(offset, offset + limit) });
          }
          if (part !== 'core') return res.status(400).json({ error: 'Unknown state part.' });
          return res.json({
            users: user.role === 'System Admin' ? db.users.map(safeUser) : [],
            currentUser: safeUser(user),
            counts: { projects: db.projects.length, auditLogs: db.auditLogs.length },
            boxes: db.boxes,
            dossiers: db.dossiers,
            uploadHistory: db.uploadHistory,
            notifications: db.notifications,
            _revision: db.revision,
          });
        }

        if (req.method === 'PUT') {
          if (!['System Admin', 'Archive Manager'].includes(user.role)) {
            return res.status(403).json({ error: 'ليس لديك صلاحية تعديل بيانات الأرشيف.' });
          }
          const expectedRevision = Number(req.body?._revision);
          if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
            return res.status(428).json({ error: 'Missing database revision.' });
          }
          if (expectedRevision !== db.revision) {
            return res.status(409).json({ error: 'تم تعديل البيانات من مستخدم آخر. أعد تحميل الصفحة قبل الحفظ مرة أخرى.' });
          }
          const checked = validateStatePayload(req.body);
          if (checked.error || !checked.state) return res.status(400).json({ error: checked.error });
          db.boxes = checked.state.boxes;
          db.dossiers = checked.state.dossiers;
          db.projects = checked.state.projects;
          db.uploadHistory = checked.state.uploadHistory;
          db.notifications = checked.state.notifications;
          db.auditLogs = checked.state.auditLogs;
          db.revision += 1;
          saveLocalDb(db);
          return res.json({ ok: true, revision: db.revision, updatedAt: new Date().toISOString() });
        }
        return res.status(405).json({ error: 'Method not allowed.' });
      }

      // PostgreSQL path (single-query core read)
      const userRows = await sql`SELECT id, username, email, name, role, active, last_login FROM arms_users WHERE id = ${session.sub} LIMIT 1`;
      const user = userRows[0];
      if (!user || !user.active) return res.status(401).json({ error: 'الحساب غير نشط أو لم يعد موجوداً.' });

      if (req.method === 'GET') {
        const part = String(req.query.part || 'core');
        if (part === 'projects' || part === 'audit') {
          const limit = Math.max(1, Math.min(3000, Number(req.query.limit || 1000)));
          const offset = Math.max(0, Number(req.query.offset || 0));
          const rows =
            part === 'projects'
              ? await sql`SELECT COALESCE((SELECT revision FROM arms_app_state WHERE id = 1), 0)::text AS revision, COALESCE((SELECT jsonb_agg(t.data ORDER BY t.job_id) FROM (SELECT job_id, data FROM arms_projects ORDER BY job_id OFFSET ${offset} LIMIT ${limit}) t), '[]'::jsonb)::text AS items`
              : await sql`SELECT COALESCE((SELECT revision FROM arms_app_state WHERE id = 1), 0)::text AS revision, COALESCE((SELECT jsonb_agg(t.data ORDER BY t.created_at DESC, t.id) FROM (SELECT id, created_at, data FROM arms_audit_logs ORDER BY created_at DESC, id OFFSET ${offset} LIMIT ${limit}) t), '[]'::jsonb)::text AS items`;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          return res.status(200).send(`{"_revision":${Number(rows[0].revision)},"items":${rows[0].items}}`);
        }
        if (part !== 'core') return res.status(400).json({ error: 'Unknown state part.' });
        const isAdmin = user.role === 'System Admin';
        const [coreRow] = await sql`SELECT
          COALESCE((SELECT revision FROM arms_app_state WHERE id = 1), 0)::text AS revision,
          (SELECT COUNT(*)::int FROM arms_projects) AS projects_count,
          (SELECT COUNT(*)::int FROM arms_audit_logs) AS audit_count,
          COALESCE((SELECT jsonb_agg(data ORDER BY first_job_id ASC) FROM arms_boxes), '[]'::jsonb)::text AS boxes,
          COALESCE((SELECT jsonb_agg(data ORDER BY box_code ASC, dossier_number ASC) FROM arms_dossiers), '[]'::jsonb)::text AS dossiers,
          COALESCE((SELECT jsonb_agg(data ORDER BY created_at DESC, id) FROM arms_upload_history), '[]'::jsonb)::text AS upload_history,
          COALESCE((SELECT jsonb_agg(data ORDER BY created_at DESC, id) FROM arms_notifications), '[]'::jsonb)::text AS notifications,
          CASE WHEN ${isAdmin} THEN
            COALESCE((SELECT jsonb_agg(jsonb_build_object('id', id, 'username', username, 'email', COALESCE(email, ''), 'name', name, 'role', role, 'active', active, 'lastLogin', COALESCE(last_login::text, 'Never')) ORDER BY created_at ASC) FROM arms_users), '[]'::jsonb)::text
          ELSE '[]'
          END AS users_json`;
        const head = JSON.stringify({
          currentUser: safeUser(user),
          counts: { projects: Number(coreRow.projects_count), auditLogs: Number(coreRow.audit_count) },
        }).slice(0, -1);
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res
          .status(200)
          .send(
            `${head},"users":${coreRow.users_json},"boxes":${coreRow.boxes},"dossiers":${coreRow.dossiers},"uploadHistory":${coreRow.upload_history},"notifications":${coreRow.notifications},"_revision":${Number(coreRow.revision)}}`
          );
      }

      if (req.method === 'PUT') {
        if (!['System Admin', 'Archive Manager'].includes(user.role)) {
          return res.status(403).json({ error: 'ليس لديك صلاحية تعديل بيانات الأرشيف.' });
        }
        const expectedRevision = Number(req.body?._revision);
        if (!Number.isInteger(expectedRevision) || expectedRevision < 0) {
          return res.status(428).json({ error: 'Missing database revision.' });
        }
        const checked = validateStatePayload(req.body);
        if (checked.error || !checked.state) return res.status(400).json({ error: checked.error });
        try {
          const saved = await sql`SELECT public.arms_save_state(${JSON.stringify(checked.state)}::text::jsonb, ${expectedRevision}) AS revision`;
          return res.json({ ok: true, revision: Number(saved[0].revision), updatedAt: new Date().toISOString() });
        } catch (error: any) {
          if (error?.code === '40001' || String(error?.message || '').includes('ARMS_REVISION_CONFLICT')) {
            return res.status(409).json({ error: 'تم تعديل البيانات من مستخدم آخر. أعد تحميل الصفحة قبل الحفظ مرة أخرى.' });
          }
          throw error;
        }
      }
      return res.status(405).json({ error: 'Method not allowed.' });
    } catch (error) {
      const info = describePgError(error);
      return res.status(info.status).json(info);
    }
  });

  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API route not found.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`ARMS server running at http://${HOST}:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed starting ARMS server:', err);
  process.exit(1);
});
