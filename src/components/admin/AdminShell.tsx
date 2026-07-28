import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import SadoMark from '../SadoMark';

interface AdminShellProps {
  user: any;
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  theme: string;
  onToggleTheme: () => void;
  children: React.ReactNode;
}

export default function AdminShell({
  user,
  activeView,
  onNavigate,
  onLogout,
  theme,
  onToggleTheme,
  children
}: AdminShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'NAZORAT (SUPER)';
      case 'agency_admin': return 'ADMINISTRATOR';
      case 'operator': return 'OPERATOR';
      default: return role.toUpperCase();
    }
  };

  const menuItems = [
    { key: 'dashboard', label: 'Boshqaruv paneli', icon: <Icons.LayoutDashboard size={16} />, roles: ['operator', 'agency_admin', 'super_admin'] },
    { key: 'appeals', label: 'Murojaatlar', icon: <Icons.Inbox size={16} />, roles: ['operator', 'agency_admin', 'super_admin'] },
    { key: 'agencies', label: 'Idoralar', icon: <Icons.Building2 size={16} />, roles: ['super_admin'] },
    { key: 'team', label: 'Xodimlar', icon: <Icons.Users size={16} />, roles: ['agency_admin', 'super_admin'] },
    { key: 'ai-monitoring', label: 'AI monitoring', icon: <Icons.Cpu size={16} />, roles: ['agency_admin', 'super_admin'] },
    { key: 'reports', label: 'Hisobotlar', icon: <Icons.BarChart3 size={16} />, roles: ['agency_admin', 'super_admin'] },
    { key: 'audit', label: 'Audit jurnali', icon: <Icons.History size={16} />, roles: ['agency_admin', 'super_admin'] },
    { key: 'profile', label: 'Profil', icon: <Icons.User size={16} />, roles: ['operator', 'agency_admin', 'super_admin'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="flex h-screen overflow-hidden bg-brand-bg text-brand-text font-sans text-[14px]">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] shrink-0 border-r border-brand-line bg-brand-surface relative select-none">
        {/* Agency Identity Block */}
        <div className="p-4 border-b border-brand-line/60 bg-brand-accent/5 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
            <SadoMark size={32} className="text-brand-accent" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-extrabold text-brand-text font-display uppercase tracking-tight truncate leading-tight">
              {user.agency?.name || "Tizim Nazorati"}
            </h2>
            <span className="text-[9px] font-bold tracking-widest text-brand-dim uppercase block mt-0.5">
              {getRoleLabel(user.role)}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {allowedItems.map(item => {
            const isActive = activeView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-brand-accent/15 text-brand-accent border-l-4 border-brand-accent pl-2 rounded-l-none'
                    : 'text-brand-muted hover:bg-brand-surface2 hover:text-brand-text'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Signed-in user card pinned at bottom */}
        <div className="p-4 border-t border-brand-line bg-brand-surface2 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center font-bold text-xs select-none">
              {user.full_name?.charAt(0) || "U"}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-brand-text truncate">{user.full_name}</h3>
              <p className="text-[10px] font-mono text-brand-dim truncate mt-0.5">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Tizimdan chiqish"
            className="text-brand-muted hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors shrink-0"
          >
            <Icons.LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/60 backdrop-blur-sm">
          <div className="w-[240px] bg-brand-surface flex flex-col h-full border-r border-brand-line">
            <div className="p-4 border-b border-brand-line bg-brand-accent/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold">
                  <SadoMark size={28} className="text-brand-accent" />
                </div>
                <div>
                  <h2 className="text-xs font-extrabold text-brand-text uppercase tracking-tight max-w-[120px] truncate leading-tight">
                    {user.agency?.name}
                  </h2>
                  <span className="text-[9px] font-bold tracking-widest text-brand-dim uppercase block">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-brand-muted p-1"
              >
                <Icons.X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
              {allowedItems.map(item => {
                const isActive = activeView === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      onNavigate(item.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-accent/15 text-brand-accent border-l-4 border-brand-accent pl-2 rounded-l-none'
                        : 'text-brand-muted hover:bg-brand-surface2 hover:text-brand-text'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-brand-line bg-brand-surface2 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center font-bold text-xs">
                  {user.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-brand-text truncate max-w-[100px]">{user.full_name}</h3>
                  <p className="text-[10px] font-mono text-brand-dim">@{user.username}</p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-brand-muted hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
              >
                <Icons.LogOut size={14} />
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="h-14 border-b border-brand-line/60 bg-brand-surface px-4 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center space-x-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-brand-muted hover:text-brand-text p-1 hover:bg-brand-surface2 rounded-md"
            >
              <Icons.Menu size={18} />
            </button>
            <h1 className="text-sm font-bold font-display text-brand-text capitalize tracking-tight flex items-center space-x-2">
              <span>{menuItems.find(m => m.key === activeView)?.label || "Boshqaruv"}</span>
            </h1>
          </div>

          {/* Right Header Side Controls */}
          <div className="flex items-center space-x-2.5">
            {/* Theme switcher */}
            <button
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-lg bg-brand-surface2 border border-brand-line flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-surface3 transition-colors"
              title={theme === 'dark' ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
            >
              {theme === 'dark' ? <Icons.Sun size={15} /> : <Icons.Moon size={15} />}
            </button>

            {/* Notification Indicator Bell */}
            <div className="relative">
              <button className="w-9 h-9 rounded-lg bg-brand-surface2 border border-brand-line flex items-center justify-center text-brand-muted hover:text-brand-text hover:bg-brand-surface3 transition-colors">
                <Icons.Bell size={15} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-accent ring-2 ring-brand-surface"></span>
              </button>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-brand-line"></div>

            {/* User Dropdown Profile Action */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-1.5 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/40 text-brand-accent flex items-center justify-center font-bold text-xs select-none">
                  {user.full_name?.charAt(0)}
                </div>
                <Icons.ChevronDown size={12} className="text-brand-dim" />
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2.5 w-48 rounded-xl border border-brand-line bg-brand-surface shadow-xl z-20 py-1.5 select-none animate-fadeIn">
                    <div className="px-3.5 py-2 border-b border-brand-line/60">
                      <p className="text-[11px] font-bold text-brand-dim uppercase tracking-wider">Kirgan Foydalanuvchi</p>
                      <p className="text-xs font-semibold text-brand-text truncate mt-0.5">{user.full_name}</p>
                    </div>
                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-brand-muted hover:text-brand-text hover:bg-brand-surface2 transition-colors font-medium"
                    >
                      <Icons.User size={13} />
                      <span>Shaxsiy Profil</span>
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center space-x-2.5 px-3.5 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors font-bold border-t border-brand-line/40"
                    >
                      <Icons.LogOut size={13} />
                      <span>Tizimdan chiqish</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic page contents nested inside */}
        <main className="flex-1 overflow-auto bg-brand-bg relative p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
