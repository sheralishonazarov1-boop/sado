import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Region } from '../types';
import * as Icons from 'lucide-react';
import { Locale, getTranslation } from '../i18n';

interface ProfileViewProps {
  user: any;
  onUpdateUser: (updatedUser: any) => void;
  onLogout: () => void;
  locale: Locale;
  onChangeLocale: (l: Locale) => void;
  theme?: string;
  onChangeTheme?: (t: string) => void;
}

export default function ProfileView({ 
  user, 
  onUpdateUser, 
  onLogout, 
  locale, 
  onChangeLocale,
  theme = "dark",
  onChangeTheme
}: ProfileViewProps) {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [viloyatId, setViloyatId] = useState(String(user.viloyat_id || "1"));
  const [tumanId, setTumanId] = useState(String(user.tuman_id || ""));
  const [mahallaId, setMahallaId] = useState(String(user.mahalla_id || ""));
  const [addressDetail, setAddressDetail] = useState(user.address_detail || "");

  // Notification toggles
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);

  const [viloyats, setViloyats] = useState<Region[]>([]);
  const [tumans, setTumans] = useState<Region[]>([]);
  const [mahallas, setMahallas] = useState<Region[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load geography cascades
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<{ items: Region[] }>("/api/regions?level=viloyat"),
      user.viloyat_id ? api.get<{ items: Region[] }>(`/api/regions?parent_id=${user.viloyat_id}`) : Promise.resolve({ items: [] }),
      user.tuman_id ? api.get<{ items: Region[] }>(`/api/regions?parent_id=${user.tuman_id}`) : Promise.resolve({ items: [] })
    ]).then(([viloyatsRes, tumansRes, mahallasRes]) => {
      setViloyats(viloyatsRes.items);
      setTumans(tumansRes.items);
      setMahallas(mahallasRes.items);
      setLoading(false);
    }).catch(err => {
      console.warn(err);
      setError("Hududiy ma'lumotlarni yuklashda xatolik.");
      setLoading(false);
    });
  }, [user]);

  // Handle cascading changes
  const handleViloyatChange = async (val: string) => {
    setViloyatId(val);
    setTumanId("");
    setMahallaId("");
    setTumans([]);
    setMahallas([]);
    try {
      const res = await api.get<{ items: Region[] }>(`/api/regions?parent_id=${val}`);
      setTumans(res.items);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleTumanChange = async (val: string) => {
    setTumanId(val);
    setMahallaId("");
    setMahallas([]);
    try {
      const res = await api.get<{ items: Region[] }>(`/api/regions?parent_id=${val}`);
      setMahallas(res.items);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!fullName.trim()) {
      setError("Iltimos, ism va familiyangizni kiriting.");
      return;
    }
    if (!viloyatId || !tumanId || !mahallaId) {
      setError("Iltimos, barcha hududlarni to'liq tanlang.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post<any>("/api/auth/complete-profile", {
        full_name: fullName.trim(),
        viloyat_id: Number(viloyatId),
        tuman_id: Number(tumanId),
        mahalla_id: Number(mahallaId),
        address_detail: addressDetail.trim()
      });

      onUpdateUser(res);
      setSuccess("Profil ma'lumotlari muvaffaqiyatli saqlandi!");
    } catch (err: any) {
      setError(err.detail || "Profilni yangilashda xatolik yuz berdi.");
    } finally {
      setSaving(false);
    }
  };

  const getMahallaLabel = () => {
    const matched = mahallas.find(m => m.id === Number(mahallaId));
    return matched ? matched.name : (user.mahalla_id ? "Al-Xorazmiy MFY" : "Aniqlanmagan");
  };

  const getTumanLabel = () => {
    const matched = tumans.find(t => t.id === Number(tumanId));
    return matched ? matched.name : (user.tuman_id ? "Urganch shahri" : "Aniqlanmagan");
  };

  const initials = fullName ? fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase() : "FU";
  
  const phoneVal = user.phone || "998991234567";
  const formattedPhone = `+${phoneVal.substring(0, 3)} ${phoneVal.substring(3, 5)} ${phoneVal.substring(5, 8)} ${phoneVal.substring(8, 10)} ${phoneVal.substring(10, 12)}`;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 py-6 space-y-6" id="profile-two-column">
      
      {/* Title */}
      <div className="space-y-1 pb-4 border-b border-brand-line/50">
        <h2 className="text-[26px] font-bold text-brand-text font-display leading-tight">{getTranslation(locale, "profile_title")}</h2>
        <p className="text-xs text-brand-muted font-medium">{getTranslation(locale, "profile_desc")}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold flex items-center space-x-2">
          <Icons.AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-brand-accent-glow/20 border border-brand-accent/20 text-brand-accent p-4 rounded-xl text-xs font-bold flex items-center space-x-2">
          <Icons.CheckCircle size={15} className="animate-bounce" />
          <span>{success}</span>
        </div>
      )}

      {/* Grid: Left 40% (5 cols equivalent), Right 60% (7 cols equivalent) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Identity Card Container (40% width) */}
        <div className="lg:col-span-5 bg-brand-surface border border-brand-line rounded-xl p-6 space-y-6 text-left relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-accent" />
          
          <div className="flex flex-col items-center space-y-3.5 pb-5 border-b border-brand-line/60">
            {/* Avatar block */}
            <div className="w-16 h-16 rounded-full bg-brand-accent-glow text-brand-accent border-2 border-brand-accent/30 flex items-center justify-center font-display text-lg font-black shadow-inner">
              {initials}
            </div>

            <div className="text-center space-y-0.5">
              <h3 className="text-sm font-black text-brand-text font-display">{fullName || "Fuqaro"}</h3>
              <p className="text-xs text-brand-muted font-mono font-bold">{formattedPhone}</p>
            </div>

            {/* Verification Badge */}
            <div className="inline-flex items-center space-x-1 px-3 py-1 bg-brand-accent/15 border border-brand-accent/30 rounded-full text-[10px] font-black text-brand-accent uppercase tracking-wider">
              <Icons.ShieldAlert size={11} />
              <span>{getTranslation(locale, "profile_verified")}</span>
            </div>
          </div>

          {/* Address Metadata List */}
          <div className="space-y-4 pt-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-dim">Hududiy mansublik</span>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between font-semibold py-1 border-b border-brand-line/40">
                <span className="text-brand-dim">Viloyat:</span>
                <span className="text-brand-text">Xorazm viloyati</span>
              </div>
              <div className="flex justify-between font-semibold py-1 border-b border-brand-line/40">
                <span className="text-brand-dim">Tuman:</span>
                <span className="text-brand-text">{getTumanLabel()}</span>
              </div>
              <div className="flex justify-between font-semibold py-1 border-b border-brand-line/40">
                <span className="text-brand-dim">Mahalla (MFY):</span>
                <span className="text-brand-text">{getMahallaLabel()}</span>
              </div>
              <div className="flex justify-between font-semibold py-1">
                <span className="text-brand-dim">Ko'cha va uy:</span>
                <span className="text-brand-text truncate max-w-xs">{addressDetail || "Kiritilmagan"}</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Edit Profile & Global Settings (60% width) */}
        <div className="lg:col-span-7 bg-brand-surface border border-brand-line rounded-xl p-6 space-y-6">
          
          <h3 className="text-sm font-black uppercase tracking-wider text-brand-text text-left border-b border-brand-line/60 pb-3">
            {getTranslation(locale, "profile_settings")}
          </h3>

          {loading ? (
            <div className="space-y-4">
              <div className="h-10 shimmer rounded" />
              <div className="h-10 shimmer rounded" />
              <div className="h-10 shimmer rounded" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5 text-left">
              
              {/* Language Switcher Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-dim block">Tizim tili (Language)</label>
                <div className="flex space-x-2">
                  {[
                    { key: 'uz', label: "O'zbekcha" },
                    { key: 'ru', label: "Русский" },
                    { key: 'en', label: "English" }
                  ].map(l => (
                    <button 
                      key={l.key}
                      type="button"
                      onClick={() => onChangeLocale(l.key as Locale)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-all ${locale === l.key ? 'bg-brand-accent text-white border-transparent shadow-sm' : 'border-brand-line bg-brand-surface2 hover:bg-brand-surface3 text-brand-muted hover:text-brand-text'}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Switcher Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-dim block">
                  {getTranslation(locale, "theme")}
                </label>
                <div className="flex space-x-2">
                  {[
                    { key: 'light', label: locale === 'uz' ? "Yorug' (Light)" : locale === 'ru' ? "Светлая" : "Light", icon: <Icons.Sun size={14} /> },
                    { key: 'dark', label: locale === 'uz' ? "Qorong'i (Dark)" : locale === 'ru' ? "Темная" : "Dark", icon: <Icons.Moon size={14} /> }
                  ].map(t => (
                    <button 
                      key={t.key}
                      type="button"
                      onClick={() => onChangeTheme && onChangeTheme(t.key)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1.5 ${theme === t.key ? 'bg-brand-accent text-white border-transparent shadow-sm' : 'border-brand-line bg-brand-surface2 hover:bg-brand-surface3 text-brand-muted hover:text-brand-text'}`}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Toggles Section */}
              <div className="space-y-3 pt-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-dim block">Bildirishnomalar sozlamasi</label>
                
                <div className="space-y-2.5">
                  {/* SMS toggle button */}
                  <label className="flex items-center justify-between p-3 bg-brand-surface2 border border-brand-line rounded-lg cursor-pointer select-none">
                    <div className="space-y-0.5 text-xs text-left">
                      <span className="font-extrabold text-brand-text">SMS bildirishnomalar</span>
                      <p className="text-[10px] text-brand-muted">Murojaat holati o'zgarganda telefon raqamingizga SMS xabar jo'natish</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={smsEnabled}
                      onChange={(e) => setSmsEnabled(e.target.checked)}
                      className="w-4.5 h-4.5 accent-brand-accent cursor-pointer rounded"
                    />
                  </label>

                  {/* Telegram integration toggle */}
                  <label className="flex items-center justify-between p-3 bg-brand-surface2 border border-brand-line rounded-lg cursor-pointer select-none">
                    <div className="space-y-0.5 text-xs text-left">
                      <span className="font-extrabold text-brand-text">Telegram bot orqali xabardorlik</span>
                      <p className="text-[10px] text-brand-muted">SADO Xorazm Telegram botiga ulanish va kuzatish</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={telegramEnabled}
                      onChange={(e) => setTelegramEnabled(e.target.checked)}
                      className="w-4.5 h-4.5 accent-brand-accent cursor-pointer rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4 pt-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-dim block">Ma'lumotlarni tahrirlash</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-brand-muted">Ism va familiya</span>
                    <input 
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-10 px-3 bg-brand-surface2 border border-brand-line focus:border-brand-accent/50 rounded-lg text-xs font-semibold text-brand-text outline-none"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-brand-muted">Viloyat</span>
                    <select 
                      value={viloyatId}
                      onChange={(e) => handleViloyatChange(e.target.value)}
                      className="w-full h-10 px-3 bg-brand-surface2 border border-brand-line rounded-lg text-xs font-semibold text-brand-text outline-none"
                    >
                      {viloyats.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-brand-muted">Tuman/Shahar</span>
                    <select 
                      value={tumanId}
                      onChange={(e) => handleTumanChange(e.target.value)}
                      className="w-full h-10 px-3 bg-brand-surface2 border border-brand-line rounded-lg text-xs font-semibold text-brand-text outline-none"
                      required
                    >
                      <option value="">Tuman</option>
                      {tumans.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-brand-muted">Mahalla</span>
                    <select 
                      value={mahallaId}
                      onChange={(e) => setMahallaId(e.target.value)}
                      className="w-full h-10 px-3 bg-brand-surface2 border border-brand-line rounded-lg text-xs font-semibold text-brand-text outline-none"
                      disabled={!tumanId}
                      required
                    >
                      <option value="">Mahalla</option>
                      {mahallas.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-brand-muted">Aniq ko'cha, uy va xonadon manzili</span>
                  <input 
                    type="text"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    className="w-full h-10 px-3 bg-brand-surface2 border border-brand-line focus:border-brand-accent/50 rounded-lg text-xs font-semibold text-brand-text outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons: Save & Log out */}
              <div className="flex flex-col sm:flex-row gap-3 pt-3">
                <button 
                  type="submit"
                  disabled={saving || !mahallaId}
                  className="flex-1 h-11 bg-brand-accent text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-brand-accent/5"
                >
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
                
                <button 
                  type="button"
                  onClick={onLogout}
                  className="flex-1 h-11 border border-red-500/30 hover:bg-red-500/10 text-red-400 font-bold rounded-xl text-sm transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Icons.LogOut size={15} />
                  <span>{getTranslation(locale, "logout")}</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>

    </div>
  );
}
