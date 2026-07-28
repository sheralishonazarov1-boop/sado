import React, { useEffect, useState } from 'react';
import { api } from './api';
import * as Icons from 'lucide-react';
import { Locale, getTranslation, getNestedTranslation } from './i18n';
import SadoMark from './components/SadoMark';

// Import Modular Components
import LandingView from './components/LandingView';
import TransparencyView from './components/TransparencyView';
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import NewAppealView from './components/NewAppealView';
import AppealsListView from './components/AppealsListView';
import AgenciesView from './components/AgenciesView';
import ProfileView from './components/ProfileView';
import AdminApp from './components/admin/AdminApp';

export default function App() {
  const [isAdminRoute, setIsAdminRoute] = useState(() => {
    return window.location.pathname.startsWith('/admin') || window.location.hash === '#admin';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin') || window.location.hash === '#admin');
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  if (isAdminRoute) {
    return <AdminApp />;
  }

  const [user, setUser] = useState<any | null>(null);
  const [view, setView] = useState<string>("landing");
  const [viewParams, setViewParams] = useState<any | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [appLoading, setAppLoading] = useState(true);

  // Localization and theme states
  const [locale, setLocale] = useState<Locale>(() => {
    return (localStorage.getItem("app_locale") as Locale) || "uz";
  });
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem("app_theme") || "dark";
  });

  // Global search states
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Menu toggles
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app_theme", theme);
  }, [theme]);

  // Locale effect
  useEffect(() => {
    localStorage.setItem("app_locale", locale);
  }, [locale]);

  // Authentication Handshake check on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("citizen_auth_token");
      if (token) {
        api.get<any>("/api/auth/me")
          .then(res => {
            setUser(res);
            setView("dashboard");
            setAppLoading(false);
          })
          .catch(err => {
            console.log("Token handshake failed (stale or expired token):", err?.detail || err?.message || err);
            localStorage.removeItem("citizen_auth_token");
            setUser(null);
            setView("landing");
            setAppLoading(false);
          });
      } else {
        setUser(null);
        setView("landing");
        setAppLoading(false);
      }
    };

    checkAuth();

    const handleAuthFail = () => {
      setUser(null);
      setView("landing");
    };
    window.addEventListener("auth_unauthorized", handleAuthFail);
    return () => window.removeEventListener("auth_unauthorized", handleAuthFail);
  }, []);

  // Fetch full notifications list and unread count
  const fetchNotifications = () => {
    if (!user) return;
    api.get<{ items: any[] }>("/api/me/notifications")
      .then(res => {
        setNotifications(res.items || []);
        const unreads = res.items.filter(n => !n.is_read).length;
        setUnreadNotifications(unreads);
      })
      .catch(err => {
        console.warn("Failed to load notifications:", err);
      });
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 25000); // 25s polling
      return () => clearInterval(interval);
    }
  }, [user]);

  // Global search API query
  useEffect(() => {
    if (!searchQuery.trim() || !user) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const delayDebounce = setTimeout(() => {
      api.get<{ items: any[] }>(`/api/me/appeals?q=${encodeURIComponent(searchQuery)}`)
        .then(res => {
          setSearchResults(res.items || []);
          setSearching(false);
        })
        .catch(err => {
          console.warn("Global search failed:", err);
          setSearching(false);
        });
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, user]);

  const handleNavigate = (targetView: string, params: any = null) => {
    setView(targetView);
    setViewParams(params);
    // Auto scroll content area to top
    const mainEl = document.getElementById("main-content-scroll");
    if (mainEl) mainEl.scrollTop = 0;
  };

  const handleClearParams = () => {
    setViewParams(null);
  };

  const handleLoginSuccess = (token: string, userProfile: any) => {
    setUser(userProfile);
    setView("dashboard");
    fetchNotifications();
  };

  const handleLogout = () => {
    localStorage.removeItem("citizen_auth_token");
    setUser(null);
    setView("landing");
    setUserDropdownOpen(false);
  };

  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    try {
      await api.post("/api/me/notifications/read-all", {});
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  const handleNotificationClick = async (n: any) => {
    setNotifDropdownOpen(false);
    setNotifModalOpen(false);
    try {
      if (!n.is_read) {
        await api.post(`/api/me/notifications/${n.id}/read`, {});
        fetchNotifications();
      }
    } catch (err) {
      console.warn("Could not mark individual notification as read:", err);
    }
    handleNavigate("appeals", { activeAppealId: n.appeal_id });
  };

  // Helper relative time builder
  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      if (locale === 'uz') return "Hozirgina";
      if (locale === 'ru') return "Только что";
      return "Just now";
    }
    if (diffMins < 60) {
      if (locale === 'uz') return `${diffMins} daqiqa oldin`;
      if (locale === 'ru') return `${diffMins} мин. назад`;
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      if (locale === 'uz') return `${diffHours} soat oldin`;
      if (locale === 'ru') return `${diffHours} ч. назад`;
      return `${diffHours}h ago`;
    }
    if (locale === 'uz') return `${diffDays} kun oldin`;
    if (locale === 'ru') return `${diffDays} дн. назад`;
    return `${diffDays}d ago`;
  };

  // UI Page Titles & Breadcrumbs Config
  const getPageTitleAndBreadcrumb = () => {
    switch (view) {
      case "dashboard":
        return {
          title: getTranslation(locale, "nav_home"),
          breadcrumb: getTranslation(locale, "nav_asb")
        };
      case "appeals":
        return {
          title: getTranslation(locale, "nav_appeals"),
          breadcrumb: getTranslation(locale, "nav_appeals")
        };
      case "new-appeal":
        return {
          title: getTranslation(locale, "nav_new_appeal"),
          breadcrumb: getTranslation(locale, "nav_new_appeal")
        };
      case "agencies":
        return {
          title: getTranslation(locale, "nav_agencies"),
          breadcrumb: getTranslation(locale, "nav_agencies")
        };
      case "profile":
        return {
          title: getTranslation(locale, "nav_profile"),
          breadcrumb: getTranslation(locale, "nav_profile")
        };
      case "landing":
        return {
          title: getTranslation(locale, "nav_asb"),
          breadcrumb: "Portal"
        };
      case "transparency":
        return {
          title: getTranslation(locale, "nav_transparency"),
          breadcrumb: "Portal"
        };
      default:
        return { title: "SADO — Fuqaro murojaatlari platformasi", breadcrumb: "Portal" };
    }
  };

  const pageMeta = getPageTitleAndBreadcrumb();

  // Render view dispatcher passing down locales and hooks
  const renderViewContent = () => {
    switch (view) {
      case "landing":
        return <LandingView onNavigate={handleNavigate} locale={locale} />;
      case "transparency":
        return <TransparencyView locale={locale} />;
      case "login":
        return <LoginView onLoginSuccess={handleLoginSuccess} locale={locale} />;
      
      // Authenticated views
      case "dashboard":
        return user ? <DashboardView user={user} onNavigate={handleNavigate} locale={locale} /> : <LoginView onLoginSuccess={handleLoginSuccess} locale={locale} />;
      case "new-appeal":
        return user ? <NewAppealView user={user} onNavigate={handleNavigate} locale={locale} /> : <LoginView onLoginSuccess={handleLoginSuccess} locale={locale} />;
      case "appeals":
        return user ? (
          <AppealsListView 
            initialFilterStatus={viewParams?.filterStatus} 
            initialAppealId={viewParams?.activeAppealId} 
            onClearParams={handleClearParams} 
            locale={locale}
          />
        ) : <LoginView onLoginSuccess={handleLoginSuccess} locale={locale} />;
      case "agencies":
        return <AgenciesView onNavigate={handleNavigate} locale={locale} />;
      case "profile":
        return user ? (
          <ProfileView 
            user={user} 
            onUpdateUser={setUser} 
            onLogout={handleLogout} 
            locale={locale}
            theme={theme}
            onChangeTheme={setTheme}
            onChangeLocale={setLocale}
          />
        ) : <LoginView onLoginSuccess={handleLoginSuccess} locale={locale} />;
      default:
        return <LandingView onNavigate={handleNavigate} locale={locale} />;
    }
  };

  if (appLoading) {
    return (
      <div className="fixed inset-0 bg-[#0A0F0C] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-[0.1em] text-brand-accent uppercase">Yuklanmoqda...</span>
      </div>
    );
  }

  const userInitials = user?.full_name ? user.full_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "F";

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col select-none font-sans" id="app-root">
      
      {/* 1. GLOBAL FIXED HEADER (64px tall, absolute/fixed top index 50 with backdrop-blur) */}
      <header 
        className="fixed top-0 left-0 right-0 h-16 border-b border-brand-line z-50 flex items-center justify-between px-4 md:px-6 shrink-0" 
        id="global-header"
        style={{
          backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(21, 163, 74, 0.03)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)'
        }}
      >
        
        {/* Left Side: Logo Brand Block aligned at 248px desktop width over sidebar */}
        <div className="flex items-center space-x-3 w-auto md:w-[230px] lg:w-[248px] shrink-0 cursor-pointer" onClick={() => handleNavigate(user ? "dashboard" : "landing")}>
          <SadoMark size={32} className="text-brand-accent shrink-0" />
          <div className="md:hidden leading-none">
            <span className="text-[16px] font-[800] tracking-[0.02em] text-brand-text font-display block">SADO</span>
          </div>
          <div className="hidden md:block leading-none">
            <span className="text-[17px] font-extrabold tracking-[0.02em] text-brand-text font-display block">SADO</span>
            <span className="text-[9px] font-semibold text-brand-dim uppercase tracking-[0.1em] block mt-1">XORAZM · FUQARO MUROJAATLARI</span>
          </div>
        </div>

        {/* Center Side: Active Breadcrumb & Page Title (hidden on mobile) */}
        <div className="hidden md:flex flex-col items-center text-center flex-1 md:flex-initial px-4 md:px-0">
          <div className="hidden md:flex items-center space-x-1.5 text-[11px] text-brand-dim font-medium select-none mb-0.5 uppercase tracking-wider">
            <span>Portal</span>
            <Icons.ChevronRight size={10} />
            <span className="text-brand-muted">{pageMeta.breadcrumb}</span>
          </div>
          <h1 className="text-sm md:text-[15px] font-semibold text-brand-text select-all font-display truncate max-w-[150px] sm:max-w-xs md:max-w-md">
            {pageMeta.title}
          </h1>
        </div>

        {/* Right Side Cluster: Controls with 12px gaps */}
        <div className="flex items-center space-x-3 relative shrink-0">
          
          {/* A. Global Search - expanding input, collapsed under 1100px */}
          {user && (
            <div className="relative flex items-center">
              <div className={`transition-all duration-300 flex items-center rounded-lg border bg-brand-surface2 ${searchOpen ? 'w-[200px] sm:w-[280px] border-brand-accent px-3' : 'w-0 border-transparent overflow-hidden'}`}>
                <input 
                  type="text"
                  placeholder={getTranslation(locale, "search_by_code")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 bg-transparent outline-none text-xs text-brand-text placeholder-brand-dim border-none pr-1"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-brand-dim hover:text-brand-text">
                    <Icons.X size={12} />
                  </button>
                )}
              </div>
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center transition-colors hover:bg-brand-surface2 ${searchOpen ? 'text-brand-accent ml-1 bg-brand-surface2' : 'text-brand-muted'}`}
                title={getTranslation(locale, "search")}
              >
                <Icons.Search size={17} />
              </button>

              {/* Search Result Dropdown Overlay */}
              {searchOpen && searchQuery.trim() && (
                <div className="absolute top-12 right-0 w-[280px] sm:w-[320px] bg-brand-surface border border-brand-line rounded-xl shadow-2xl p-2 z-50 max-h-72 overflow-y-auto space-y-1">
                  <div className="text-[10px] uppercase font-bold text-brand-dim px-2 py-1 tracking-wider border-b border-brand-line/60">
                    {searching ? getTranslation(locale, "new_appeal_ai_shimmer") : `${getTranslation(locale, "nav_appeals")} (${searchResults.length})`}
                  </div>
                  {searchResults.length === 0 && !searching ? (
                    <div className="text-xs text-brand-muted p-3 text-center">{getTranslation(locale, "empty_list")}</div>
                  ) : (
                    searchResults.map(item => (
                      <div 
                        key={item.id} 
                        onClick={() => {
                          setSearchQuery("");
                          setSearchOpen(false);
                          handleNavigate("appeals", { activeAppealId: item.id });
                        }}
                        className="p-2 rounded-lg hover:bg-brand-surface2 cursor-pointer transition-colors text-left space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-brand-accent tracking-wider bg-brand-accent-glow px-1.5 py-0.5 rounded">
                            {item.tracking_code}
                          </span>
                          <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded text-white`} style={{ backgroundColor: `var(--st-${item.status})` }}>
                            {getTranslation(locale, `status_${item.status}`)}
                          </span>
                        </div>
                        <p className="text-xs text-brand-text line-clamp-1">{item.text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* B. Language Switcher Menu (hidden on mobile) */}
          <div className="relative hidden md:block">
            <button 
              onClick={() => {
                setLangDropdownOpen(!langDropdownOpen);
                setNotifDropdownOpen(false);
                setUserDropdownOpen(false);
              }}
              className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center transition-colors hover:bg-brand-surface2 text-brand-muted text-xs font-bold"
            >
              {locale.toUpperCase()}
            </button>
            
            {langDropdownOpen && (
              <div className="absolute top-12 right-0 w-36 bg-brand-surface border border-brand-line rounded-xl shadow-2xl p-1.5 z-50 space-y-0.5">
                <button 
                  onClick={() => { setLocale("uz"); setLangDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${locale === 'uz' ? 'bg-brand-accent-glow text-brand-accent' : 'text-brand-text hover:bg-brand-surface2'}`}
                >
                  O'zbekcha
                </button>
                <button 
                  onClick={() => { setLocale("ru"); setLangDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${locale === 'ru' ? 'bg-brand-accent-glow text-brand-accent' : 'text-brand-text hover:bg-brand-surface2'}`}
                >
                  Русский
                </button>
                <button 
                  onClick={() => { setLocale("en"); setLangDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${locale === 'en' ? 'bg-brand-accent-glow text-brand-accent' : 'text-brand-text hover:bg-brand-surface2'}`}
                >
                  English
                </button>
              </div>
            )}
          </div>

          {/* C. Theme Switcher Toggle (Sun/Moon icon) */}
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center transition-colors hover:bg-brand-surface2 text-brand-muted"
            title={getTranslation(locale, "theme")}
          >
            {theme === "dark" ? <Icons.Sun size={17} /> : <Icons.Moon size={17} />}
          </button>

          {/* D. Notifications Bell dropdown */}
          {user && (
            <div className="relative">
              <button 
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setLangDropdownOpen(false);
                  setUserDropdownOpen(false);
                }}
                className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center transition-colors hover:bg-brand-surface2 text-brand-muted relative"
                title={getTranslation(locale, "notif_title")}
              >
                <Icons.Bell size={17} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-brand-accent text-[#06210F] text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-brand-surface font-display">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel (renders as a full-screen sheet on mobile) */}
              {notifDropdownOpen && (
                <div className="fixed inset-0 md:absolute md:top-12 md:right-0 w-full h-full md:w-[380px] md:h-auto md:max-h-[480px] md:rounded-xl bg-brand-surface border-0 md:border border-brand-line shadow-2xl z-50 flex flex-col h-screen md:h-auto animate-in fade-in slide-in-from-bottom-5 md:slide-in-from-top-2 duration-200">
                  
                  {/* Dropdown Header */}
                  <div className="p-4 md:p-3 border-b border-brand-line flex items-center justify-between select-none bg-brand-surface shrink-0">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setNotifDropdownOpen(false)}
                        className="md:hidden p-1.5 rounded-lg hover:bg-brand-surface2 text-brand-muted flex items-center justify-center"
                      >
                        <Icons.ArrowLeft size={18} />
                      </button>
                      <span className="text-sm md:text-xs font-bold text-brand-text">
                        {getTranslation(locale, "notif_title")} ({unreadNotifications} {getTranslation(locale, "notif_unread")})
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {unreadNotifications > 0 && (
                        <button 
                          onClick={markAllNotificationsAsRead}
                          className="text-xs md:text-[10px] font-semibold text-brand-accent hover:underline"
                        >
                          {getTranslation(locale, "notif_mark_all")}
                        </button>
                      )}
                      <button 
                        onClick={() => setNotifDropdownOpen(false)}
                        className="hidden md:block text-brand-muted hover:text-brand-text"
                      >
                        <Icons.X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Dropdown Scroll List */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-1.5 space-y-1 divide-y divide-brand-line/30">
                    {notifications.length === 0 ? (
                      <div className="text-xs text-brand-muted py-12 md:py-6 text-center">{getTranslation(locale, "empty_list")}</div>
                    ) : (
                      notifications.slice(0, 15).map(n => (
                        <div 
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 md:p-2.5 rounded-lg text-left cursor-pointer transition-colors relative flex items-start space-x-2.5 ${!n.is_read ? 'bg-brand-surface2 border-l-3 border-brand-accent pl-2' : 'hover:bg-brand-surface2'} min-h-[44px]`}
                        >
                          <div className="mt-1 flex-shrink-0">
                            <span className="w-2 h-2 rounded-full block" style={{ backgroundColor: !n.is_read ? "var(--accent)" : "var(--text-dim)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-brand-text flex items-center justify-between">
                              <span className="truncate">{n.title}</span>
                              <span className="text-[9px] text-brand-dim font-mono ml-2 shrink-0">{getRelativeTime(n.created_at)}</span>
                            </div>
                            <p className="text-[11px] text-brand-muted line-clamp-2 mt-0.5 leading-relaxed">{n.body}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="p-4 md:p-2 border-t border-brand-line text-center bg-brand-surface2/40 pb-[calc(16px+env(safe-area-inset-bottom))] md:pb-2">
                    <button 
                      onClick={() => { setNotifDropdownOpen(false); setNotifModalOpen(true); }}
                      className="text-xs font-bold text-brand-accent hover:underline block w-full py-1"
                    >
                      {getTranslation(locale, "notif_view_all")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* E. User Avatar & Menu (hidden on mobile) */}
          {user ? (
            <div className="relative hidden md:block">
              <button 
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setLangDropdownOpen(false);
                  setNotifDropdownOpen(false);
                }}
                className="w-9 h-9 rounded-full bg-brand-accent-dim hover:bg-brand-accent-dim/80 border border-brand-accent/20 flex items-center justify-center text-brand-accent font-bold text-xs transition-colors cursor-pointer"
                title={user.full_name}
              >
                {userInitials}
              </button>

              {userDropdownOpen && (
                <div className="absolute top-12 right-0 w-56 bg-brand-surface border border-brand-line rounded-xl shadow-2xl p-2 z-50 space-y-1 text-left">
                  <div className="px-3 py-2 border-b border-brand-line/60 select-none">
                    <div className="text-xs font-bold text-brand-text truncate">{user.full_name}</div>
                    <div className="text-[10px] text-brand-dim font-mono mt-0.5">+{user.phone}</div>
                  </div>
                  <button 
                    onClick={() => { setUserDropdownOpen(false); handleNavigate("profile"); }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold rounded-lg text-brand-text hover:bg-brand-surface2 transition-colors"
                  >
                    <Icons.User size={14} className="text-brand-muted" />
                    <span>{getTranslation(locale, "nav_profile")}</span>
                  </button>
                  <button 
                    onClick={() => { setUserDropdownOpen(false); handleNavigate("profile"); }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold rounded-lg text-brand-text hover:bg-brand-surface2 transition-colors"
                  >
                    <Icons.Settings size={14} className="text-brand-muted" />
                    <span>{getTranslation(locale, "profile_desc")}</span>
                  </button>
                  <div className="border-t border-brand-line/40 my-1" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-bold rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <Icons.LogOut size={14} />
                    <span>{getTranslation(locale, "logout")}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => handleNavigate("login")}
              className="px-4 py-1.5 bg-brand-accent hover:bg-brand-accent/90 text-[#06210F] text-xs font-bold rounded-[8px] transition-all hidden md:block"
            >
              {getTranslation(locale, "nav_login")}
            </button>
          )}

        </div>

      </header>

      {/* 2. BODY CONTENT ROW wrapper (Padding top 64px to let Header sit cleanly) */}
      <div className="flex-1 flex flex-col md:flex-row pt-16 min-h-[calc(100vh-64px)] relative">
        
        {/* SIDEBAR NAVIGATION - Starts below header, no wordmark logo, no reports/notifications */}
        {user && (
          <aside className="hidden md:flex flex-col w-[230px] lg:w-[248px] bg-brand-surface border-r border-brand-line h-[calc(100vh-64px)] sticky top-16 shrink-0 p-4 justify-between" id="app-sidebar">
            
            <div className="space-y-6">
              {/* Vertical menu navigation */}
              <nav className="space-y-1">
                
                <button 
                  onClick={() => handleNavigate("dashboard")}
                  className={`w-full flex items-center space-x-3 px-3 h-11 rounded-[10px] text-xs font-bold transition-all ${view === 'dashboard' ? 'bg-brand-accent-glow text-brand-accent' : 'text-brand-muted hover:bg-brand-surface2 hover:text-brand-text'}`}
                >
                  <Icons.LayoutDashboard size={16} />
                  <span>{getTranslation(locale, "nav_home")}</span>
                </button>

                <button 
                  onClick={() => handleNavigate("appeals")}
                  className={`w-full flex items-center space-x-3 px-3 h-11 rounded-[10px] text-xs font-bold transition-all ${view === 'appeals' ? 'bg-brand-accent-glow text-brand-accent' : 'text-brand-muted hover:bg-brand-surface2 hover:text-brand-text'}`}
                >
                  <Icons.FolderClosed size={16} />
                  <span>{getTranslation(locale, "nav_appeals")}</span>
                </button>

                <button 
                  onClick={() => handleNavigate("new-appeal")}
                  className={`w-full flex items-center space-x-3 px-3 h-11 rounded-[10px] text-xs font-bold transition-all ${view === 'new-appeal' ? 'bg-brand-accent-glow text-brand-accent' : 'text-brand-muted hover:bg-brand-surface2 hover:text-brand-text'}`}
                >
                  <Icons.PlusCircle size={16} />
                  <span>{getTranslation(locale, "nav_new_appeal")}</span>
                </button>

                <button 
                  onClick={() => handleNavigate("agencies")}
                  className={`w-full flex items-center space-x-3 px-3 h-11 rounded-[10px] text-xs font-bold transition-all ${view === 'agencies' ? 'bg-brand-accent-glow text-brand-accent' : 'text-brand-muted hover:bg-brand-surface2 hover:text-brand-text'}`}
                >
                  <Icons.Building2 size={16} />
                  <span>{getTranslation(locale, "nav_agencies")}</span>
                </button>

                <button 
                  onClick={() => handleNavigate("profile")}
                  className={`w-full flex items-center space-x-3 px-3 h-11 rounded-[10px] text-xs font-bold transition-all ${view === 'profile' ? 'bg-brand-accent-glow text-brand-accent' : 'text-brand-muted hover:bg-brand-surface2 hover:text-brand-text'}`}
                >
                  <Icons.User size={16} />
                  <span>{getTranslation(locale, "nav_profile")}</span>
                </button>

              </nav>
            </div>

            {/* Connected citizen profile info at bottom (pinned user card) */}
            <div className="flex items-center space-x-3 border-t border-brand-line pt-4 px-1">
              <div className="w-8 h-8 rounded-full bg-brand-surface2 border border-brand-line flex items-center justify-center text-brand-accent font-bold text-xs shrink-0 select-none">
                {userInitials}
              </div>
              <div className="leading-tight flex-1 min-w-0">
                <span className="text-xs font-bold text-brand-text block truncate">{user.full_name || "Fuqaro"}</span>
                <span className="text-[10px] text-brand-dim block font-mono">+{user.phone}</span>
              </div>
            </div>

          </aside>
        )}

        {/* AUTHENTICATED MOBILE BOTTOM NAVIGATION (Visible on < 768px when authenticated) */}
        {user && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-brand-surface border-t border-brand-line z-40 flex items-center justify-around px-2 shrink-0 sado-mobile-tabbar">
            
            <button 
              onClick={() => handleNavigate("dashboard")}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors ${view === 'dashboard' ? 'text-brand-accent' : 'text-brand-muted'}`}
            >
              <Icons.LayoutDashboard size={18} />
              <span className="text-[9px] font-semibold mt-1">{getTranslation(locale, "nav_home")}</span>
            </button>

            <button 
              onClick={() => handleNavigate("appeals")}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors ${view === 'appeals' ? 'text-brand-accent' : 'text-brand-muted'}`}
            >
              <Icons.FolderClosed size={18} />
              <span className="text-[9px] font-semibold mt-1">{getTranslation(locale, "nav_appeals")}</span>
            </button>

            {/* Central RAISED FAB action for New Appeal */}
            <button 
              onClick={() => handleNavigate("new-appeal")}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#1B5E3F] to-[#3DDC84] text-[#06210F] shadow-lg shadow-brand-accent/30 flex items-center justify-center -translate-y-4 active:scale-95 transition-transform"
            >
              <Icons.Plus size={24} strokeWidth={2.8} />
            </button>

            <button 
              onClick={() => handleNavigate("agencies")}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors ${view === 'agencies' ? 'text-brand-accent' : 'text-brand-muted'}`}
            >
              <Icons.Building2 size={18} />
              <span className="text-[9px] font-semibold mt-1">{getTranslation(locale, "nav_agencies")}</span>
            </button>

            <button 
              onClick={() => handleNavigate("profile")}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-colors ${view === 'profile' ? 'text-brand-accent' : 'text-brand-muted'}`}
            >
              <Icons.User size={18} />
              <span className="text-[9px] font-semibold mt-1">Profil</span>
            </button>

          </nav>
        )}

        {/* MAIN VIEWPORT CONTENT PANEL - Scrollable container */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 sado-mobile-scroll-padding" id="main-content-scroll">
          <div className="w-full h-full">
            {renderViewContent()}
          </div>
        </main>

      </div>

      {/* Centered Modal: Barchasini ko'rish (Full Notifications List) */}
      {notifModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-line rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-brand-line flex items-center justify-between">
              <h2 className="text-sm font-bold text-brand-text flex items-center space-x-2">
                <Icons.Bell size={16} className="text-brand-accent" />
                <span>{getTranslation(locale, "notif_title")}</span>
              </h2>
              <button 
                onClick={() => setNotifModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-brand-surface2 flex items-center justify-center text-brand-muted hover:text-brand-text transition-colors"
              >
                <Icons.X size={16} />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2 divide-y divide-brand-line/40">
              {notifications.length === 0 ? (
                <div className="text-xs text-brand-muted py-8 text-center">{getTranslation(locale, "empty_list")}</div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 rounded-xl text-left cursor-pointer transition-colors relative flex items-start space-x-3 mt-1 ${!n.is_read ? 'bg-brand-surface2 border-l-4 border-brand-accent pl-2.5' : 'hover:bg-brand-surface2'}`}
                  >
                    <div className="mt-1 flex-shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: !n.is_read ? "var(--accent)" : "var(--text-dim)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-brand-text flex items-center justify-between">
                        <span className="truncate">{n.title}</span>
                        <span className="text-[10px] text-brand-dim font-mono shrink-0 ml-2">{getRelativeTime(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-brand-muted mt-1 leading-relaxed">{n.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-brand-line bg-brand-surface2/30 flex justify-end">
              <button 
                onClick={() => setNotifModalOpen(false)}
                className="px-4 py-2 bg-brand-surface2 hover:bg-brand-surface3 text-brand-text text-xs font-bold rounded-lg transition-colors"
              >
                {getTranslation(locale, "close")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
