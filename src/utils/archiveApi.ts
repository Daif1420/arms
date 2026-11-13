/**
 * ARMS - API client helpers.
 * Network wrapper plus the chunked archive loader (keeps every request small and fast).
 */

export type ApiResult<T = any> = { ok: boolean; status: number; body: T | null; notJson: boolean; text: string };

const NOT_JSON_MESSAGE = 'تعذر الاتصال بخادم البيانات (/api). تأكد من تشغيل الخادم.';

/** Builds a user-facing message from an API error body, appending the error code/detail when present. */
export const apiErrorMessage = (body: { error?: string; code?: string; detail?: string } | null, fallback: string) => {
  const extra = [body?.code, body?.detail].filter(Boolean).join(' — ');
  return `${body?.error || fallback}${extra ? ` [${extra}]` : ''}`;
};

const SESSION_TOKEN_KEY = 'arms_session_token';
let memorySessionToken: string | null = null;

export function getSessionToken(): string | null {
  if (memorySessionToken) return memorySessionToken;
  try {
    memorySessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    return memorySessionToken;
  } catch {
    return null;
  }
}

export function setSessionToken(token: string | null) {
  memorySessionToken = token;
  try {
    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {
    /* sessionStorage unavailable */
  }
}

/** Always times out, always returns parsed JSON (or null) and never throws on non-JSON bodies. Throws only on network failure/timeout. */
export async function apiFetch<T = any>(url: string, init: RequestInit = {}, timeoutMs = 30000): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  const headers = new Headers(init.headers);
  const token = getSessionToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...init,
      headers,
      signal: init.signal ?? controller.signal,
    });
    const text = await response.text();
    let body: T | null = null;
    let notJson = false;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      notJson = true;
    }
    return {
      ok: response.ok,
      status: response.status,
      body,
      notJson,
      text: notJson ? text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160) : '',
    };
  } catch {
    if (controller.signal.aborted) {
      throw new Error('انتهت مهلة الاتصال بالخادم. تحقق من الإنترنت أو إعدادات قاعدة البيانات.');
    }
    throw new Error('تعذر الوصول إلى الخادم. تحقق من الاتصال بالإنترنت.');
  } finally {
    window.clearTimeout(timer);
  }
}

export const errorFrom = (r: ApiResult, fallback: string) => {
  if (!r.notJson) return apiErrorMessage(r.body, `${fallback} (${r.status})`);
  if (r.status === 404 || r.status === 200) return NOT_JSON_MESSAGE;
  return `${fallback}: استجابة غير متوقعة من الخادم (${r.status})${r.text ? ` — ${r.text}` : ''}`;
};

// ---- Chunked archive loading -------------------------------------------------------------------

const PAGE_SIZE = 1000;
const AUDIT_PAGE_SIZE = 500;
const PARALLEL_REQUESTS = 2;
const ATTEMPTS = 3;

export type ArchiveSnapshot = {
  boxes: any[];
  dossiers: any[];
  projects: any[];
  uploadHistory: any[];
  notifications: any[];
  auditLogs: any[];
  users: any[];
  currentUser: any;
  _revision: number;
};

class RevisionChanged extends Error {}

async function getPart(query: string, label: string) {
  let lastError: Error = new Error(label);
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const r = await apiFetch(`/api/state?${query}`, {}, 28000);
      if (r.ok && r.body) return r.body;
      lastError = new Error(errorFrom(r, label));
      if (r.status === 401 || r.status === 403 || r.status === 404 || r.status === 503) break;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(label);
    }
    if (attempt < ATTEMPTS) await new Promise(resolve => setTimeout(resolve, 400 * attempt));
  }
  throw lastError;
}

async function runPool<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        results[index] = await worker(items[index]);
      }
    })
  );
  return results;
}

async function loadOnce(): Promise<ArchiveSnapshot> {
  const core = await getPart('part=core', 'تعذر تحميل بيانات الأرشيف');
  const revision = Number(core._revision || 0);
  const pages = (part: 'projects' | 'audit', total: number, size: number) =>
    Array.from({ length: Math.ceil((total || 0) / size) }, (_, i) => ({ part, offset: i * size, size }));

  const jobs = [
    ...pages('projects', core.counts?.projects, PAGE_SIZE),
    ...pages('audit', core.counts?.auditLogs, AUDIT_PAGE_SIZE),
  ];
  const loaded = await runPool(jobs, PARALLEL_REQUESTS, async job => {
    const body = await getPart(`part=${job.part}&offset=${job.offset}&limit=${job.size}`, 'تعذر تحميل بيانات الأرشيف');
    if (Number(body._revision) !== revision) throw new RevisionChanged();
    return { part: job.part, items: body.items as any[] };
  });

  const collect = (part: string) => loaded.filter(l => l.part === part).flatMap(l => l.items);
  return {
    boxes: core.boxes || [],
    dossiers: core.dossiers || [],
    uploadHistory: core.uploadHistory || [],
    notifications: core.notifications || [],
    projects: collect('projects'),
    auditLogs: collect('audit'),
    users: core.users || [],
    currentUser: core.currentUser,
    _revision: revision,
  };
}

export async function loadArchiveSnapshot(): Promise<ArchiveSnapshot> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await loadOnce();
    } catch (error) {
      if (!(error instanceof RevisionChanged) || attempt >= 3) {
        throw error instanceof RevisionChanged ? new Error('تغيّرت البيانات أثناء التحميل. أعد المحاولة.') : error;
      }
    }
  }
}
