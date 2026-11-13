import React, { useEffect, useState } from 'react';
import {
  Archive,
  Eye,
  EyeOff,
  FileBarChart,
  FolderArchive,
  Globe,
  KeyRound,
  LockKeyhole,
  LogIn,
  Moon,
  Printer,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from 'lucide-react';
import { useArchive } from '../../context/ArchiveContext';
import { IntercomLogo } from '../common/IntercomLogo';
import archiveReportsHero from '../../assets/images/archive_reports_hero_1794602023269.jpg';

const THEME_KEY = 'arms_theme';
const readTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark';
  } catch {
    return false;
  }
};

const HERO_IMAGE_SRC = archiveReportsHero;

export const LoginView: React.FC = () => {
  const { login, setupRequired, authError, language, setLanguage } = useArchive();
  const ar = language === 'ar';
  const t = (arabic: string, english: string) => (ar ? arabic : english);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [setupSecret, setSetupSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(readTheme);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);
  const [heroError, setHeroError] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
    } catch {
      /* storage unavailable */
    }
  }, [darkMode]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await login({
        action: setupRequired ? 'setup' : 'login',
        username,
        password,
        name,
        email,
        setupSecret,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : t('حدث خطأ غير متوقع.', 'Unexpected error occurred.'));
      setBusy(false);
    }
  };

  const buttonLabel = busy
    ? t('جارٍ التحقق...', 'Signing in...')
    : setupRequired
    ? t('إنشاء حساب المسؤول', 'Create Administrator')
    : t('تسجيل الدخول', 'Sign In');

  const inputBase =
    'w-full h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors focus:border-[#0B56A8] focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-[#0B56A8]/20';

  return (
    <main dir={ar ? 'rtl' : 'ltr'} className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-slate-950 transition-colors">
      {/* Right Column in RTL (Form Panel) */}
      <section className="relative flex flex-col justify-between px-6 py-6 sm:px-12 lg:px-16">
        {/* Top utility controls */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDarkMode(v => !v)}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-[#0B56A8] hover:text-[#0B56A8] flex items-center justify-center transition-colors shadow-2xs"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setLanguage(ar ? 'en' : 'ar')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-[#0B56A8] hover:text-[#0B56A8] transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{ar ? 'EN' : 'عربي'}</span>
          </button>
        </div>

        {/* Centered Login Form */}
        <div className="w-full max-w-[420px] mx-auto my-auto py-8">
          <div className="flex flex-col items-center text-center mb-8">
            <IntercomLogo size="lg" className="mb-6" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {setupRequired ? t('إعداد حساب مدير النظام', 'Create System Administrator') : t('أهلاً بعودتك', 'Welcome Back')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
              {setupRequired
                ? t(
                    'أنشئ أول حساب مسؤول لتشغيل نظام الأرشيف.',
                    'Create the initial administrator account to launch the archive system.'
                  )
                : t(
                    'يرجى إدخال بيانات الدخول الخاصة بك للوصول إلى نظام إدارة الأرشيف.',
                    'Please enter your credentials to access the archive management system.'
                  )}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {setupRequired && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('مفتاح الإعداد الأولي', 'Initial Setup Key')}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      required
                      type="password"
                      value={setupSecret}
                      onChange={e => setSetupSecret(e.target.value)}
                      className={`${inputBase} ps-10 pe-4`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('الاسم بالكامل', 'Full Name')}
                  </label>
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={`${inputBase} px-4`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('البريد الإلكتروني (اختياري)', 'Email (optional)')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={`${inputBase} px-4`}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('معرّف المستخدم', 'User ID')}
              </label>
              <div className="relative">
                <UserRound className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={t('أدخل اسم المستخدم', 'Enter your username')}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className={`${inputBase} ps-10 pe-4`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('كلمة المرور', 'Password')}
              </label>
              <div className="relative">
                <LockKeyhole className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={1}
                  autoComplete={setupRequired ? 'new-password' : 'current-password'}
                  placeholder={t('أدخل كلمة المرور (أرقام أو حروف)', 'Enter password (any digits or text)')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={`${inputBase} ps-10 pe-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? t('إخفاء كلمة المرور', 'Hide password') : t('إظهار كلمة المرور', 'Show password')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#0B56A8] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!setupRequired && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotOpen(v => !v)}
                  className="text-xs font-semibold text-[#0B56A8] dark:text-blue-400 hover:underline"
                >
                  {t('هل نسيت كلمة المرور؟', 'Forgot password?')}
                </button>
              </div>
            )}

            {forgotOpen && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                {t(
                  'لإعادة تعيين كلمة المرور، يرجى التواصل مع مسؤول النظام (System Admin) لإصدار كلمة مرور جديدة من لوحة إدارة المستخدمين.',
                  'To reset your password, please contact your System Administrator to issue a new password from User Management.'
                )}
              </div>
            )}

            {(error || authError) && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-[#E52225] dark:text-red-300 text-xs font-medium p-3 break-words"
              >
                {error || authError}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-[#0B56A8] hover:bg-[#094488] disabled:opacity-60 text-white font-bold text-sm transition-colors shadow-sm cursor-pointer"
            >
              {setupRequired ? <ShieldCheck className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>{buttonLabel}</span>
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('بتسجيل الدخول، أنت توافق على ', 'By signing in, you agree to our ')}
            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="font-semibold text-[#0B56A8] dark:text-blue-400 hover:underline"
            >
              {t('شروط الخدمة', 'Terms of Service')}
            </button>
            {t(' و ', ' and ')}
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="font-semibold text-[#0B56A8] dark:text-blue-400 hover:underline"
            >
              {t('سياسة الخصوصية', 'Privacy Policy')}
            </button>
            .
          </p>
        </div>

        {/* Footer */}
        <footer className="text-center text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 pt-4">
          <div className="font-bold text-slate-700 dark:text-slate-300">ARMS · Intercom 2026 ©</div>
          <div>
            Archive Reports Management System{' '}
            <span className="font-bold text-[#0B56A8] dark:text-blue-400">Intercom Standard</span>
          </div>
        </footer>
      </section>

      {/* Left Column in RTL (Architectural Visual Showcase Panel) */}
      <aside className="relative hidden lg:flex items-center justify-center p-10 overflow-hidden bg-[#0B1F3B]">
        {!heroError ? (
          <img
            src={HERO_IMAGE_SRC}
            alt="Archive Reports and Records Facility"
            referrerPolicy="no-referrer"
            onError={() => setHeroError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}

        {/* Measured contrast scrim */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#08162B]/85 via-[#0B56A8]/40 to-[#08162B]/65"
          aria-hidden="true"
        />

        {/* Frosted Feature Showcase Card */}
        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white/92 dark:bg-slate-900/92 backdrop-blur-md border border-white/70 dark:border-slate-700/70 p-8 shadow-2xl">
          <div className="text-xs font-bold text-[#0B56A8] dark:text-blue-400">
            {t('منصة إدارة الأرشيف · ARMS', 'Archive Operations Platform · ARMS')}
          </div>

          <h2 className="mt-2 text-2xl font-extrabold text-[#0B56A8] dark:text-white leading-snug text-balance">
            {t('كل بيانات الأرشيف في مكان واحد', 'All Archive Operations in One Place')}
          </h2>

          <p className="mt-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t(
              'تابع حالة البوكسات والدوسيهات، استورد ملفات المشاريع، واطبع الليبلات الحرارية وتقارير التدقيق بسهولة من خلال لوحة واحدة.',
              'Track archive boxes and dossiers, import project batches, print thermal labels, and monitor audit reports from one unified console.'
            )}
          </p>

          <hr className="my-6 border-slate-200/90 dark:border-slate-700/80" />

          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#EAF2FB] dark:bg-[#0B56A8]/25 text-[#0B56A8] dark:text-blue-400 flex items-center justify-center shrink-0">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('البوكسات والدوسيهات', 'Boxes & Dossiers')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t('تتبع دقيق 300 مشروع لكل بوكس', 'Strict 300-slot box & 50-slot dossier tracking')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-[#B45309] dark:text-amber-400 flex items-center justify-center shrink-0">
                <FileBarChart className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('اكتشاف الفجوات والتقارير', 'Gap Detection & Reports')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t('تحليل فوري للنواقص وسجل الاعتمادات', 'Automated sequence gap detection & 13 reports')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#E52225] dark:text-red-400 flex items-center justify-center shrink-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('طباعة الليبلات الحرارية', 'Thermal Label Printing')}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {t('مطابقة قياسية 100×50 مم مع رمز QR', 'Standard 100×50 mm PDF labels with QR codes')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Terms / Privacy Modal */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <Archive className="w-4 h-4 text-[#0B56A8]" />
                <span>
                  {legalModal === 'terms'
                    ? t('شروط الخدمة والاستخدام', 'Terms of Service')
                    : t('سياسة الخصوصية وأمن البيانات', 'Privacy Policy')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {legalModal === 'terms'
                ? t(
                    'هذا النظام مخصص لعمليات الأرشفة المعتمدة داخل شركة Intercom. يتم تسجيل كافة عمليات الاستيراد وتعديل الحالات والإغلاق الإداري تلقائياً في سجل التدقيق (Audit Log).',
                    'This system is restricted to authorized Intercom archive operations. All imports, status updates, and administrative actions are permanently logged in the audit trail.'
                  )
                : t(
                    'تُحفظ جلسات الدخول باستخدام ملفات تعريف ارتباط مشفرة (HttpOnly Cookies)، ولا يتم مشاركة بيانات المشاريع أو المستخدمين مع أي أطراف خارجية.',
                    'Authentication sessions are secured with signed HttpOnly cookies. Project records and user credentials are stored securely and never shared externally.'
                  )}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="px-4 py-2 rounded-lg bg-[#0B56A8] hover:bg-[#094488] text-white text-xs font-semibold"
              >
                {t('حسناً', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
