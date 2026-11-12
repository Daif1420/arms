import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSql, describeError } from './_lib/db.js';
import { readSession } from './_lib/auth.js';

const MAX_BODY_BYTES = 4 * 1024 * 1024;
const EMPTY_STATE = { boxes: [], dossiers: [], projects: [], uploadHistory: [], notifications: [], auditLogs: [], users: [] };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً.' });
  try {
    const sql = getSql();
    const userRows = await sql`SELECT id, username, email, name, role, active, last_login FROM arms_users WHERE id = ${session.sub} LIMIT 1`;
    const user = userRows[0];
    if (!user || !user.active) return res.status(401).json({ error: 'الحساب غير نشط أو لم يعد موجوداً.' });
    if (req.method === 'GET') {
      const [boxes, dossiers, projects, uploadHistory, notifications, auditLogs, revisionRows, userList] = await Promise.all([
        sql`SELECT data FROM arms_boxes ORDER BY first_job_id ASC`,
        sql`SELECT data FROM arms_dossiers ORDER BY box_code ASC, dossier_number ASC`,
        sql`SELECT data FROM arms_projects ORDER BY job_id ASC`,
        sql`SELECT data FROM arms_upload_history ORDER BY created_at DESC`,
        sql`SELECT data FROM arms_notifications ORDER BY created_at DESC`,
        sql`SELECT data FROM arms_audit_logs ORDER BY created_at DESC`,
        sql`SELECT revision FROM arms_app_state WHERE id = 1`,
        user.role === 'System Admin' ? sql`SELECT id, username, email, name, role, active, last_login FROM arms_users ORDER BY created_at ASC` : Promise.resolve([] as any[]),
      ]);
      return res.status(200).json({
        ...EMPTY_STATE,
        boxes: boxes.map((r: any) => r.data), dossiers: dossiers.map((r: any) => r.data), projects: projects.map((r: any) => r.data),
        uploadHistory: uploadHistory.map((r: any) => r.data), notifications: notifications.map((r: any) => r.data), auditLogs: auditLogs.map((r: any) => r.data),
        users: userList.map((u: any) => ({ id: u.id, username: u.username, email: u.email || '', name: u.name, role: u.role, active: u.active, lastLogin: u.last_login || 'Never' })),
        currentUser: { id: user.id, username: user.username, email: user.email || '', name: user.name, role: user.role, active: user.active, lastLogin: user.last_login || 'Never' },
        _revision: Number(revisionRows[0]?.revision || 0),
      });
    }
    if (req.method === 'PUT') {
      if (!['System Admin', 'Archive Manager'].includes(user.role)) return res.status(403).json({ error: 'ليس لديك صلاحية تعديل بيانات الأرشيف.' });
      const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
      if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return res.status(413).json({ error: 'Payload too large.' });
      const parsed = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const expectedRevision = Number(parsed?._revision);
      if (!Number.isInteger(expectedRevision) || expectedRevision < 0) return res.status(428).json({ error: 'Missing database revision. Reload the application.' });
      const requiredArrays = ['boxes', 'dossiers', 'projects', 'uploadHistory', 'notifications', 'auditLogs'];
      if (requiredArrays.some(key => !Array.isArray(parsed?.[key]))) return res.status(400).json({ error: 'Invalid archive state payload.' });
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
        if (!match || !Number.isInteger(firstJobId) || firstJobId < 35500 || (firstJobId - 35500) % 300 !== 0) return false;
        return Number(match[1]) === 42 + (firstJobId - 35500) / 300;
      };
      const boxCodes = new Set(state.boxes.filter((b: any) => b && typeof b.boxCode === 'string').map((b: any) => b.boxCode));
      if (boxCodes.size !== state.boxes.length || state.boxes.some((b: any) => !b || !expectedBox(b.boxCode, b.firstJobId) || b.lastJobId !== b.firstJobId + 299)) return res.status(400).json({ error: 'Invalid box range. D42 must start at 35500 and each box contains exactly 300 consecutive IDs.' });
      for (const b of state.boxes as any[]) {
        const n = Number(String(b.boxCode).slice(1));
        if (n > 42 && !boxCodes.has(`D${n - 1}`)) return res.status(400).json({ error: `Missing previous box D${n - 1}; box sequence cannot skip.` });
      }
      const seenIds = new Set<number>();
      for (const p of state.projects as any[]) {
        if (!p || !Number.isInteger(p.jobId) || p.jobId < 35500 || !['Archived', 'Missing', 'Pending'].includes(p.status)) return res.status(400).json({ error: 'Invalid project record.' });
        const index = Math.floor((p.jobId - 35500) / 300);
        const expectedCode = `D${42 + index}`;
        const expectedDossier = Math.floor(((p.jobId - 35500) % 300) / 50) + 1;
        if (!p || p.boxId !== expectedCode || p.dossierNumber !== expectedDossier || p.slotIndex !== ((p.jobId - 35500) % 50) || !boxCodes.has(expectedCode) || seenIds.has(p.jobId)) return res.status(400).json({ error: `Project ${p.jobId} does not match its fixed box/dossier slot.` });
        seenIds.add(p.jobId);
      }
      const dossierIds = new Set<string>();
      for (const d of state.dossiers as any[]) {
        if (!d || !d.id || d.id !== `${d.boxId}-${d.dossierNumber}` || !boxCodes.has(d.boxId) || !Number.isInteger(d.dossierNumber) || d.dossierNumber < 1 || d.dossierNumber > 6 || dossierIds.has(d.id)) return res.status(400).json({ error: 'Invalid dossier-to-box relationship.' });
        dossierIds.add(d.id);
      }
      if ([...state.uploadHistory, ...state.notifications, ...state.auditLogs].some((r: any) => !r || typeof r.id !== 'string' || !r.id)) return res.status(400).json({ error: 'Invalid history or notification record.' });
      for (const b of state.boxes as any[]) {
        const count = (state.projects as any[]).filter(p => p.boxId === b.boxCode).length;
        const dossierCount = (state.dossiers as any[]).filter(d => d.boxId === b.boxCode).length;
        if (count !== 300 || dossierCount !== 6) return res.status(400).json({ error: `Box ${b.boxCode} must contain exactly 300 project slots and 6 dossiers.` });
      }
      try {
        const saved = await sql`SELECT public.arms_save_state(${JSON.stringify(state)}::text::jsonb, ${expectedRevision}) AS revision`;
        return res.status(200).json({ ok: true, revision: Number(saved[0].revision), updatedAt: new Date().toISOString() });
      } catch (error: any) {
        if (error?.code === '40001' || String(error?.message || '').includes('ARMS_REVISION_CONFLICT')) return res.status(409).json({ error: 'تم تعديل البيانات من مستخدم آخر. أعد تحميل الصفحة قبل الحفظ مرة أخرى.' });
        throw error;
      }
    }
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error('ARMS API error:', error);
    const info = describeError(error, 'Database operation failed.');
    return res.status(info.status).json({ error: info.error, code: info.code, detail: info.detail });
  }
}
