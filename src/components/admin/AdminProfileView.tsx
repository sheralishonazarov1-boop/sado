import React, { useState } from 'react';
import * as Icons from 'lucide-react';

interface AdminProfileProps {
  user: any;
}

export default function AdminProfileView({ user }: AdminProfileProps) {
  const [fullName, setFullName] = useState(user.full_name);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Ism-sharif maydoni bo'sh bo'lishi mumkin emas.");
      return;
    }

    user.full_name = fullName;
    triggerToast("Profil ma'lumotlari muvaffaqiyatli saqlandi.");
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Iltimos, barcha parol maydonlarini to'ldiring.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Yangi parol va uning tasdig'i mos kelmadi.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Yangi parol kamida 6 ta belgidan iborat bo'lishi shart.");
      return;
    }

    user.password = newPassword;
    triggerToast("Tizim paroli muvaffaqiyatli o'zgartirildi.");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <div className="space-y-4 max-w-[800px] mx-auto pb-8 select-none font-medium">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#3DDC84]/15 border border-[#3DDC84]/30 text-[#3DDC84] px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 animate-fadeIn text-xs font-bold">
          <Icons.CheckCircle size={15} />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-start space-x-2 animate-fadeIn">
          <Icons.AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Card & Info */}
        <div className="bg-brand-surface border border-brand-line p-5 rounded-xl space-y-4 h-fit">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-brand-accent/20 border border-brand-accent/40 text-brand-accent flex items-center justify-center font-bold text-lg select-none">
              {fullName?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-text">{fullName}</h2>
              <p className="text-xs text-brand-dim mt-0.5 font-mono">@{user.username}</p>
            </div>
          </div>

          <div className="border-t border-brand-line/50 pt-4 space-y-3.5 text-xs">
            <div className="flex justify-between items-center h-8">
              <span className="text-brand-dim uppercase tracking-wider font-bold text-[10px]">Tegishli Idorasi:</span>
              <span className="text-brand-text font-bold truncate max-w-[200px]">{user.agency?.name || "Viloyat Hokimligi"}</span>
            </div>
            <div className="flex justify-between items-center h-8">
              <span className="text-brand-dim uppercase tracking-wider font-bold text-[10px]">Tizimdagi roli:</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-accent/15 text-brand-accent uppercase">
                {user.role}
              </span>
            </div>
            <div className="flex justify-between items-center h-8">
              <span className="text-brand-dim uppercase tracking-wider font-bold text-[10px]">So'nggi kirish:</span>
              <span className="text-brand-muted font-mono">{user.last_login_at ? new Date(user.last_login_at).toLocaleString('uz-UZ') : "Hozir"}</span>
            </div>
          </div>

          {/* Edit Name Form */}
          <form onSubmit={handleSaveProfile} className="pt-4 border-t border-brand-line/50 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider">Ism va familiyangiz</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-10 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs text-brand-text focus:outline-none focus:border-brand-accent font-semibold"
              />
            </div>
            <button
              type="submit"
              className="h-10 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white font-bold rounded-lg text-xs transition-colors shadow-sm"
            >
              Ma'lumotlarni saqlash
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-brand-surface border border-brand-line p-5 rounded-xl h-fit">
          <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-4 flex items-center space-x-1.5">
            <Icons.Lock size={14} className="text-brand-accent" />
            <span>Xavfsizlik & Parolni yangilash</span>
          </h3>

          <form onSubmit={handleUpdatePassword} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Joriy Parol</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full h-10 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs text-brand-text focus:outline-none focus:border-brand-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Yangi Parol</label>
              <input
                type="password"
                required
                placeholder="kamida 6 ta belgi"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full h-10 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs text-brand-text focus:outline-none focus:border-brand-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Yangi Parolni tasdiqlash</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-10 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs text-brand-text focus:outline-none focus:border-brand-accent"
              />
            </div>

            <button
              type="submit"
              className="h-10 px-4 bg-brand-surface3 hover:bg-brand-surface2 border border-brand-line hover:border-brand-accent text-brand-text font-bold rounded-lg text-xs transition-colors w-full"
            >
              Parolni yangilash
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
