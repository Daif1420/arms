import postgres from 'postgres';

// Clean pasted connection strings (strip accidental surrounding quotes or leading "psql ").
export function databaseUrl(): string {
  const strip = (v: string) => v.trim().replace(/^['"]+|['"]+$/g, '').trim();
  let value = strip(process.env.DATABASE_URL || '');
  value = strip(value.replace(/^psql\s+/i, ''));
  return value;
}

// Connection pool tuned for serverless & Supabase transaction pooler (port 6543):
// - prepare: false is required by PgBouncer transaction pooling.
// - fetch_types: false skips pg_type introspection on cold connects (major latency win).
// - connect_timeout: 15 tolerates cold cross-region TLS handshakes.
let client: ReturnType<typeof postgres> | undefined;
let clientUrl = '';

export function getSql() {
  const url = databaseUrl();
  if (!url) throw new Error('DATABASE_URL is not configured.');
  if (!client || clientUrl !== url) {
    client = postgres(url, {
      ssl: 'require',
      prepare: false,
      fetch_types: false,
      max: 6,
      idle_timeout: 20,
      connect_timeout: 15,
    });
    clientUrl = url;
  }
  return client;
}

export type ApiError = { status: number; error: string; code: string; detail?: string };

function sanitize(message: string): string {
  return message
    .replace(/[a-z][a-z0-9+.-]*:\/\/\S+/gi, '[url]')
    .replace(/\bpassword\s*[=:]\s*\S+/gi, 'password=[hidden]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

export function describeError(error: unknown, fallback = 'Authentication service failed.'): ApiError {
  const err = error as { code?: string; message?: string; name?: string };
  const message = String(err?.message || '');
  const code = String(err?.code || err?.name || 'UNKNOWN');
  const haystack = `${message} ${code}`;

  if (code === 'QUERY_TIMEOUT') {
    return {
      status: 504,
      code,
      error: 'استغرق الاستعلام وقتاً أطول من المسموح. تحقق من سرعة الاتصال بقاعدة البيانات.',
    };
  }
  if (['42P01', '42883', '42703', '42P10'].includes(code)) {
    return {
      status: 503,
      code,
      error: 'قاعدة البيانات غير مهيأة أو قديمة: شغّل scripts/schema.sql في SQL Editor الخاص بقاعدة البيانات.',
    };
  }
  if (message.includes('ARMS_SESSION_SECRET')) {
    return {
      status: 500,
      code,
      error: 'ARMS_SESSION_SECRET غير مضبوط أو أقل من 32 حرفاً.',
    };
  }
  if (message.includes('ARMS_ADMIN')) {
    return {
      status: 500,
      code,
      error: 'إعدادات ARMS_ADMIN_USERNAME / ARMS_ADMIN_PASSWORD غير صحيحة.',
    };
  }
  if (
    message.includes('DATABASE_URL') ||
    /connection string|invalid url|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|CONNECT_TIMEOUT|CONNECTION_|fetch failed|password authentication failed|tenant or user not found|28P01|3D000/i.test(
      haystack
    )
  ) {
    return {
      status: 503,
      code,
      error: 'تعذر الاتصال بقاعدة البيانات: راجع قيمة DATABASE_URL (بدون علامات تنصيص، ورابط Pooler الصحيح).',
    };
  }
  return { status: 500, code, error: fallback, detail: sanitize(message) || undefined };
}
