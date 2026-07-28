import React, { useState, useEffect } from 'react';
import AdminLoginView from './AdminLoginView';
import AdminShell from './AdminShell';
import AdminDashboardView from './AdminDashboardView';
import AdminAppealsQueueView from './AdminAppealsQueueView';
import AdminAgenciesView from './AdminAgenciesView';
import AdminStaffView from './AdminStaffView';
import AdminAiMonitoringView from './AdminAiMonitoringView';
import AdminReportsView from './AdminReportsView';
import AdminAuditView from './AdminAuditView';
import AdminProfileView from './AdminProfileView';
import { adminApi } from '../../api';

export default function AdminApp() {
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem("sado_admin_token"));
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(!!adminToken);
  const [activeView, setActiveView] = useState("dashboard");
  const [viewParams, setViewParams] = useState<any>(null);
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("sado_admin_theme") || "dark");

  const fetchCurrentUser = async () => {
    try {
      const user = await adminApi.get<any>("/api/admin/auth/me");
      setAdminUser(user);
    } catch (err) {
      console.error(err);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchCurrentUser();
    }
    const handleAuthFail = () => handleLogout();
    window.addEventListener("admin_auth_unauthorized", handleAuthFail);
    return () => window.removeEventListener("admin_auth_unauthorized", handleAuthFail);
  }, [adminToken]);

  const handleLoginSuccess = (token: string, user: any) => {
    localStorage.setItem("sado_admin_token", token);
    setAdminToken(token);
    setAdminUser(user);
    setActiveView("dashboard");
  };

  const handleLogout = async () => {
    if (adminToken) {
      try {
        await adminApi.post("/api/admin/auth/logout");
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.removeItem("sado_admin_token");
    setAdminToken(null);
    setAdminUser(null);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem("sado_admin_theme", nextTheme);
  };

  const handleNavigate = (view: string, params: any = null) => {
    setActiveView(view);
    setViewParams(params);
  };

  // Determine Agency Accent Color based on user's agency slug
  const getAgencyColor = (slug: string) => {
    switch (slug) {
      case 'hokimlik': return '#3DDC84'; // Green
      case 'kommunal': return '#38BDF8'; // Sky Blue
      case 'soglik': return '#FB7185';   // Rose Pink
      case 'yollar': return '#FBBF24';   // Yellow Amber
      case 'maktabgacha': return '#2DD4BF'; // Teal
      case 'iiw': return '#94A3B8';       // Slate Blue
      default: return '#3DDC84';
    }
  };

  const activeAgencyColor = adminUser ? getAgencyColor(adminUser.agency?.slug) : '#3DDC84';

  // Apply Theme and Color CSS variables on mount & change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-brand-accent', activeAgencyColor);
  }, [activeAgencyColor]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F0C] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-t-brand-accent border-brand-surface2 rounded-full animate-spin"></div>
        <p className="text-xs text-[#93A39A] font-bold tracking-wide">Xavfsiz tizim yuklanmoqda...</p>
      </div>
    );
  }

  if (!adminUser || !adminToken) {
    return (
      <div className="sado-admin" data-theme={theme} style={{
        '--bg': theme === 'dark' ? '#0A0F0C' : '#F7F9F8',
        '--surface': theme === 'dark' ? '#131A16' : '#FFFFFF',
        '--surface2': theme === 'dark' ? '#1B241E' : '#F0F4F2',
        '--surface3': theme === 'dark' ? '#232E27' : '#E6EBE8',
        '--line': theme === 'dark' ? '#2A352E' : '#D9E1DD',
        '--text': theme === 'dark' ? '#F1F5F2' : '#0E1310',
        '--text-muted': theme === 'dark' ? '#93A39A' : '#4B5A52',
        '--text-dim': theme === 'dark' ? '#63736B' : '#73857B',
        '--ai': theme === 'dark' ? '#A78BFA' : '#8B5CF6',
        '--ai-glow': theme === 'dark' ? 'rgba(167, 139, 250, 0.14)' : 'rgba(139, 92, 246, 0.12)',
        '--st-new': '#60A5FA',
        '--st-reviewing': '#FBBF24',
        '--st-progress': '#A78BFA',
        '--st-done': '#3DDC84',
        '--st-overdue': '#F87171',
        '--brand-accent': '#3DDC84',
        backgroundColor: 'var(--bg)',
        color: 'var(--text)'
      } as React.CSSProperties}>
        <AdminLoginView onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Render sub views depending on activeView routing state
  const renderViewContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <AdminDashboardView user={adminUser} onNavigate={handleNavigate} adminToken={adminToken} />;
      case 'appeals':
        return (
          <AdminAppealsQueueView
            user={adminUser}
            adminToken={adminToken}
            initialDetailId={viewParams?.detailId}
            onClearParams={() => setViewParams(null)}
          />
        );
      case 'agencies':
        return <AdminAgenciesView adminToken={adminToken} />;
      case 'team':
        return <AdminStaffView user={adminUser} adminToken={adminToken} />;
      case 'ai-monitoring':
        return <AdminAiMonitoringView adminToken={adminToken} />;
      case 'reports':
        return <AdminReportsView user={adminUser} adminToken={adminToken} />;
      case 'audit':
        return <AdminAuditView adminToken={adminToken} />;
      case 'profile':
        return <AdminProfileView user={adminUser} />;
      default:
        return <AdminDashboardView user={adminUser} onNavigate={handleNavigate} adminToken={adminToken} />;
    }
  };

  return (
    <div className="sado-admin h-screen" data-theme={theme} style={{
      '--bg': theme === 'dark' ? '#0A0F0C' : '#F7F9F8',
      '--surface': theme === 'dark' ? '#131A16' : '#FFFFFF',
      '--surface2': theme === 'dark' ? '#1B241E' : '#F0F4F2',
      '--surface3': theme === 'dark' ? '#232E27' : '#E6EBE8',
      '--line': theme === 'dark' ? '#2A352E' : '#D9E1DD',
      '--text': theme === 'dark' ? '#F1F5F2' : '#0E1310',
      '--text-muted': theme === 'dark' ? '#93A39A' : '#4B5A52',
      '--text-dim': theme === 'dark' ? '#63736B' : '#73857B',
      '--ai': theme === 'dark' ? '#A78BFA' : '#8B5CF6',
      '--ai-glow': theme === 'dark' ? 'rgba(167, 139, 250, 0.14)' : 'rgba(139, 92, 246, 0.12)',
      '--st-new': '#60A5FA',
      '--st-reviewing': '#FBBF24',
      '--st-progress': '#A78BFA',
      '--st-done': '#3DDC84',
      '--st-overdue': '#F87171',
      '--brand-accent': activeAgencyColor,
      backgroundColor: 'var(--bg)',
      color: 'var(--text)'
    } as React.CSSProperties}>
      <AdminShell
        user={adminUser}
        activeView={activeView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      >
        {renderViewContent()}
      </AdminShell>
    </div>
  );
}
