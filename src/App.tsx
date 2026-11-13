/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { ArchiveProvider, useArchive } from './context/ArchiveContext';
import { TopNav, ActiveTab } from './components/navigation/TopNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { BoxesView } from './components/boxes/BoxesView';
import { BoxDetailView } from './components/boxes/BoxDetailView';
import { DossiersView } from './components/dossiers/DossiersView';
import { DossierDetailView } from './components/dossiers/DossierDetailView';
import { ProjectsView } from './components/projects/ProjectsView';
import { ImportDataView } from './components/import/ImportDataView';
import { LabelsView } from './components/labels/LabelsView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditLogView } from './components/audit/AuditLogView';
import { NotificationsDrawer } from './components/notifications/NotificationsDrawer';
import { UsersManagementModal } from './components/users/UsersManagementModal';
import { ProfileModal } from './components/profile/ProfileModal';
import { LoginView } from './components/auth/LoginView';
import { IntercomLogo } from './components/common/IntercomLogo';

function MainApp() {
  const {
    language,
    dossiers,
    authenticated,
    authLoading,
    archiveLoading,
    archiveLoadError,
    retryArchiveLoad,
    toasts,
    dismissToast,
  } = useArchive();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedBoxId, setSelectedBoxId] = useState<string>('D42');
  const [selectedDossierId, setSelectedDossierId] = useState<string>('D42-1');
  const [projectsFilter, setProjectsFilter] = useState<string>('');
  const [labelInitialBoxCode, setLabelInitialBoxCode] = useState<string>('D42');

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [usersManagementOpen, setUsersManagementOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B111A] flex flex-col items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
        <IntercomLogo size="lg" />
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-[#0B56A8] animate-ping" />
          <span>ARMS · {language === 'ar' ? 'جارٍ تحميل الجلسة الآمنة...' : 'Loading secure session...'}</span>
        </div>
      </div>
    );
  }

  if (!authenticated) return <LoginView />;

  const handleNavigate = (tab: ActiveTab, param?: string) => {
    setActiveTab(tab);
    if (tab === 'box-detail' && param) {
      setSelectedBoxId(param);
    } else if (tab === 'dossier-detail' && param) {
      setSelectedDossierId(param);
    } else if (tab === 'projects' && param) {
      setProjectsFilter(param);
    } else if (tab === 'labels' && param) {
      setLabelInitialBoxCode(param);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getBreadcrumbs = () => {
    const isAr = language === 'ar';
    switch (activeTab) {
      case 'boxes':
        return [
          { label: isAr ? 'الرئيسية' : 'Dashboard', tab: 'dashboard' as ActiveTab },
          { label: isAr ? 'البوكسات' : 'Boxes' },
        ];
      case 'box-detail':
        return [
          { label: isAr ? 'الرئيسية' : 'Dashboard', tab: 'dashboard' as ActiveTab },
          { label: isAr ? 'البوكسات' : 'Boxes', tab: 'boxes' as ActiveTab },
          { label: `Box ${selectedBoxId}` },
        ];
      case 'dossiers':
        return [
          { label: isAr ? 'الرئيسية' : 'Dashboard', tab: 'dashboard' as ActiveTab },
          { label: isAr ? 'الدوسيهات' : 'Dossiers' },
        ];
      case 'dossier-detail': {
        const d = dossiers.find(x => x.id === selectedDossierId);
        return [
          { label: isAr ? 'الرئيسية' : 'Dashboard', tab: 'dashboard' as ActiveTab },
          { label: isAr ? 'البوكسات' : 'Boxes', tab: 'boxes' as ActiveTab },
          {
            label: `Box ${d?.boxId || selectedBoxId}`,
            tab: 'box-detail' as ActiveTab,
            param: d?.boxId || selectedBoxId,
          },
          { label: isAr ? `دوسيه ${d?.dossierNumber || 1}` : `Dossier ${d?.dossierNumber || 1}` },
        ];
      }
      case 'projects':
        return [
          { label: isAr ? 'الرئيسية' : 'Dashboard', tab: 'dashboard' as ActiveTab },
          { label: isAr ? 'المشاريع' : 'Projects' },
          ...(projectsFilter ? [{ label: projectsFilter }] : []),
        ];
      case 'reports':
        return [
          { label: isAr ? 'الرئيسية' : 'Dashboard', tab: 'dashboard' as ActiveTab },
          { label: isAr ? 'التقارير' : 'Reports' },
        ];
      case 'labels':
        return [
          { label: isAr ? 'الرئيسية' : 'Dashboard', tab: 'dashboard' as ActiveTab },
          { label: isAr ? 'طباعة الليبلات' : 'Labels Printing' },
        ];
      case 'import':
        return [
          { label: isAr ? 'الرئيسية' : 'Dashboard', tab: 'dashboard' as ActiveTab },
          { label: isAr ? 'استيراد البيانات' : 'Import Excel' },
        ];
      case 'audit':
        return [
          { label: isAr ? 'الرئيسية' : 'Dashboard', tab: 'dashboard' as ActiveTab },
          { label: isAr ? 'سجل العمليات' : 'Audit Log' },
        ];
      default:
        return [];
    }
  };

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-50 dark:bg-[#0B111A] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors"
    >
      <TopNav
        activeTab={activeTab}
        onNavigate={handleNavigate}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenUsersManagement={() => setUsersManagementOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        breadcrumbs={getBreadcrumbs()}
      />

      {(archiveLoading || archiveLoadError) && (
        <div className="mx-auto mt-3 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            role="status"
            className={`rounded-xl border px-4 py-3 text-sm ${
              archiveLoadError
                ? 'border-red-200 bg-red-50 text-[#E52225] dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
                : 'border-blue-200 bg-[#EAF2FB] text-[#0B56A8] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200'
            }`}
          >
            {archiveLoadError ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>تم تسجيل الدخول، لكن تعذر تحميل بيانات الأرشيف: {archiveLoadError}</span>
                <button
                  onClick={() => void retryArchiveLoad().catch(() => undefined)}
                  className="rounded-lg bg-[#0B56A8] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#094488] transition-colors"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : (
              'تم تسجيل الدخول. جارٍ تحميل بيانات الأرشيف...'
            )}
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}

        {activeTab === 'boxes' && (
          <BoxesView onNavigate={handleNavigate} onSelectBox={boxId => setSelectedBoxId(boxId)} />
        )}

        {activeTab === 'box-detail' && (
          <BoxDetailView
            boxId={selectedBoxId}
            onNavigate={handleNavigate}
            onSelectDossier={dossierId => setSelectedDossierId(dossierId)}
          />
        )}

        {activeTab === 'dossiers' && (
          <DossiersView onNavigate={handleNavigate} onSelectDossier={dossierId => setSelectedDossierId(dossierId)} />
        )}

        {activeTab === 'dossier-detail' && (
          <DossierDetailView
            dossierId={selectedDossierId}
            onNavigate={handleNavigate}
            onSelectProject={jobId => {
              setProjectsFilter(String(jobId));
              setActiveTab('projects');
            }}
          />
        )}

        {activeTab === 'projects' && <ProjectsView initialFilter={projectsFilter} />}

        {activeTab === 'import' && <ImportDataView onNavigate={handleNavigate} />}

        {activeTab === 'labels' && <LabelsView initialBoxCode={labelInitialBoxCode} />}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'audit' && <AuditLogView />}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0B56A8] dark:text-blue-400">ARMS</span>
            <span>·</span>
            <span>Archive Reports Management System</span>
            <span>·</span>
            <span>Intercom Standard</span>
          </div>
          <div className="text-[11px] tabular-nums">
            1 Box = 6 Dossiers · 1 Dossier = 50 Projects · 300 Slots
          </div>
        </div>
      </footer>

      {/* In-app Toast Notifications */}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 end-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
          {toasts.map(toast => (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold ${
                toast.type === 'error'
                  ? 'bg-red-50 border-red-200 text-[#E52225] dark:bg-red-950/90 dark:border-red-900 dark:text-red-200'
                  : toast.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-[#B45309] dark:bg-amber-950/90 dark:border-amber-900 dark:text-amber-200'
                  : toast.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/90 dark:border-emerald-900 dark:text-emerald-200'
                  : 'bg-white border-slate-200 text-[#0B56A8] dark:bg-slate-900 dark:border-slate-700 dark:text-blue-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                {(toast.type === 'error' || toast.type === 'warning') && <AlertTriangle className="w-4 h-4 shrink-0" />}
                {toast.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
                <span>{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="p-0.5 opacity-60 hover:opacity-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onNavigate={handleNavigate}
      />

      <UsersManagementModal isOpen={usersManagementOpen} onClose={() => setUsersManagementOpen(false)} />

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ArchiveProvider>
      <MainApp />
    </ArchiveProvider>
  );
}
