import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { adminApi } from '../../api';

interface AdminLoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

import SadoMark from '../SadoMark';

export default function AdminLoginView({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Iltimos, login va parolni kiriting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await adminApi.post<any>("/api/admin/auth/login", { username, password });
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err?.detail || err?.message || "Login yoki parol noto'g'ri.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-login-container" className="min-h-screen flex flex-col items-center justify-center bg-brand-bg px-4 select-none">
      <div id="admin-login-card" className="w-full max-w-[400px] bg-brand-surface border border-brand-line p-8 rounded-xl shadow-2xl relative overflow-hidden">
        {/* Top Decorative Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-brand-accent"></div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-surface2 rounded-xl mb-3 border border-brand-line">
            <SadoMark size={28} className="text-brand-accent animate-[pulse_3s_ease-in-out_infinite]" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-brand-text">SADO</h1>
          <p className="text-[10px] font-bold tracking-wider text-brand-dim mt-1.5 uppercase">
            Boshqaruv Paneli
          </p>
        </div>

        {/* Error box */}
        {error && (
          <div id="admin-login-error" className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-start space-x-2.5 animate-fadeIn">
            <Icons.AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">
              Foydalanuvchi nomi (Login)
            </label>
            <div className="relative">
              <Icons.User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dim" />
              <input
                type="text"
                required
                placeholder="masalan, kommunal.admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-brand-surface2 border border-brand-line text-xs font-medium text-brand-text placeholder-brand-dim focus:outline-none focus:border-brand-accent transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">
              Parol
            </label>
            <div className="relative">
              <Icons.Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dim" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-lg bg-brand-surface2 border border-brand-line text-xs font-medium text-brand-text placeholder-brand-dim focus:outline-none focus:border-brand-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text transition-colors p-1"
              >
                {showPassword ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-brand-accent/10 mt-6"
          >
            {loading ? (
              <Icons.Loader className="animate-spin" size={14} />
            ) : (
              <>
                <Icons.LogIn size={14} />
                <span>Tizimga kirish</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-brand-line/50 text-center">
          <p className="text-[11px] text-brand-dim leading-relaxed font-medium">
            Hisob ma'lumotlari tizim administratori tomonidan beriladi. O'z-o'zidan ro'yxatdan o'tish imkoni yo'q.
          </p>
        </div>
      </div>
    </div>
  );
}
