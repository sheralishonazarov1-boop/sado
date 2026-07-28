import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Region } from '../types';
import * as Icons from 'lucide-react';
import SadoMark from './SadoMark';

interface LoginViewProps {
  onLoginSuccess: (token: string, userProfile: any) => void;
  locale?: any;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState("+998 ");
  const [otpCode, setOtpCode] = useState<string[]>(Array(6).fill(""));
  const [devCode, setDevCode] = useState<string | null>(null);
  
  // Timer state (5 mins = 300 secs)
  const [timeLeft, setTimeLeft] = useState(300);
  const [canResend, setCanResend] = useState(false);

  // Profile Form States
  const [fullName, setFullName] = useState("");
  const [viloyatId, setViloyatId] = useState("");
  const [tumanId, setTumanId] = useState("");
  const [mahallaId, setMahallaId] = useState("");
  const [addressDetail, setAddressDetail] = useState("");

  // Cascading Geography items
  const [viloyats, setViloyats] = useState<Region[]>([]);
  const [tumans, setTumans] = useState<Region[]>([]);
  const [mahallas, setMahallas] = useState<Region[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Format Phone Input on change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+998")) {
      val = "+998 " + val.replace(/\D/g, '');
    }
    // Simple Uzbekistan format helper +998 (XX) XXX-XX-XX
    const digits = val.substring(4).replace(/\D/g, '');
    let formatted = "+998 ";
    if (digits.length > 0) {
      formatted += `(${digits.slice(0, 2)}`;
    }
    if (digits.length > 2) {
      formatted += `) ${digits.slice(2, 5)}`;
    }
    if (digits.length > 5) {
      formatted += `-${digits.slice(5, 7)}`;
    }
    if (digits.length > 7) {
      formatted += `-${digits.slice(7, 9)}`;
    }
    setPhone(formatted.slice(0, 19));
  };

  // OTP Verification countdown timer
  useEffect(() => {
    if (step !== 2) return;
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Load Viloyats on step 3
  useEffect(() => {
    if (step === 3) {
      setLoading(true);
      api.get<{ items: Region[] }>("/api/regions?level=viloyat")
        .then(res => {
          setViloyats(res.items);
          if (res.items.length > 0) {
            setViloyatId(String(res.items[0].id)); // default to Xorazm viloyati
          }
          setLoading(false);
        })
        .catch(err => {
          setError(err.detail || "Viloyatlarni yuklashda xatolik.");
          setLoading(false);
        });
    }
  }, [step]);

  // Load Tumans when Viloyat selected
  useEffect(() => {
    if (viloyatId) {
      setLoading(true);
      setTumanId("");
      setMahallaId("");
      setTumans([]);
      setMahallas([]);
      api.get<{ items: Region[] }>(`/api/regions?parent_id=${viloyatId}`)
        .then(res => {
          setTumans(res.items);
          setLoading(false);
        })
        .catch(err => {
          setError(err.detail || "Tumanlarni yuklashda xatolik.");
          setLoading(false);
        });
    }
  }, [viloyatId]);

  // Load Mahallalar when Tuman selected
  useEffect(() => {
    if (tumanId) {
      setLoading(true);
      setMahallaId("");
      setMahallas([]);
      api.get<{ items: Region[] }>(`/api/regions?parent_id=${tumanId}`)
        .then(res => {
          setMahallas(res.items);
          setLoading(false);
        })
        .catch(err => {
          setError(err.detail || "Mahallalarni yuklashda xatolik.");
          setLoading(false);
        });
    }
  }, [tumanId]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length < 12) {
      setError("Iltimos, telefon raqamingizni to'liq kiriting.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ sent: boolean; dev_code: string; expires_in: number }>("/api/auth/request-otp", {
        phone: cleanedPhone
      });
      setDevCode(res.dev_code);
      setTimeLeft(res.expires_in);
      setCanResend(false);
      setStep(2);
    } catch (err: any) {
      setError(err.detail || "OTP yuborishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const code = otpCode.join("");
    if (code.length < 6) {
      setError("Iltimos, barcha 6 ta raqamni kiriting.");
      return;
    }

    setLoading(true);
    const cleanedPhone = phone.replace(/\D/g, '');
    try {
      const res = await api.post<{ token: string; is_new: boolean; user: any }>("/api/auth/verify-otp", {
        phone: cleanedPhone,
        code
      });

      // Save token in localStorage
      localStorage.setItem("citizen_auth_token", res.token);

      if (res.is_new) {
        setStep(3);
      } else {
        onLoginSuccess(res.token, res.user);
      }
    } catch (err: any) {
      setError(err.detail || "Tasdiqlash kodi noto'g'ri.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError("Ism va familiyangizni kiriting.");
      return;
    }
    if (!viloyatId || !tumanId || !mahallaId) {
      setError("Iltimos, barcha hududiy bo'linmalarni tanlang.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<any>("/api/auth/complete-profile", {
        full_name: fullName.trim(),
        viloyat_id: Number(viloyatId),
        tuman_id: Number(tumanId),
        mahalla_id: Number(mahallaId),
        address_detail: addressDetail.trim()
      });
      
      const token = localStorage.getItem("citizen_auth_token") || "";
      onLoginSuccess(token, res);
    } catch (err: any) {
      setError(err.detail || "Profilni yakunlashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (index: number, val: string) => {
    setError(null);
    const cleanVal = val.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otpCode];
    newOtp[index] = cleanVal;
    setOtpCode(newOtp);

    if (cleanVal && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      const newOtp = text.split("");
      setOtpCode(newOtp);
      otpRefs.current[5]?.focus();
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-12" id="login-container">
      <div className="bg-brand-surface border border-brand-line rounded-[18px] p-6 md:p-8 space-y-6">
        
        {/* Title / Logo */}
        <div className="flex flex-col items-center mb-6 text-center space-y-2">
          <div className="w-14 h-14 bg-brand-surface2 rounded-xl flex items-center justify-center mb-3 border border-brand-line">
            <SadoMark size={28} className="text-brand-accent animate-[pulse_3s_ease-in-out_infinite]" />
          </div>
          <h2 className="text-xl font-bold text-brand-text font-display tracking-tight">Tizimga kirish</h2>
          <p className="text-xs text-brand-muted">SADO platformasining fuqaro shaxsiy kabineti</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-[12px] text-xs font-semibold flex items-center space-x-2">
            <Icons.AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Phone input */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4" id="form-phone">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Telefon raqamingiz</label>
              <div className="relative">
                <Icons.Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-dim" size={18} />
                <input 
                  type="text"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+998 (__) ___-__-__"
                  className="w-full h-12 pl-12 pr-4 bg-brand-surface2 border border-brand-line focus:border-brand-accent focus:ring-4 focus:ring-brand-accent-glow/20 rounded-[12px] text-[16px] md:text-sm text-brand-text font-semibold outline-none transition-all sado-input"
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-50 text-[#06210F] font-semibold rounded-[14px] transition-all flex items-center justify-center space-x-2 sado-btn sado-btn-primary"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-accent-dim border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Kodni olish</span>
                  <Icons.ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6" id="form-otp">
            <div className="text-center space-y-1">
              <span className="text-xs text-brand-muted">Kiritilgan telefon raqami</span>
              <p className="text-sm font-semibold text-brand-text">{phone}</p>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="text-xs text-brand-accent hover:underline"
              >
                O'zgartirish
              </button>
            </div>

            {/* Dev mode alert banner */}
            {devCode && (
              <div className="border border-dashed border-brand-ai bg-brand-ai-glow/10 p-3 rounded-[12px] text-center">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-ai block mb-1">Tizimni sinab ko'rish</span>
                <span className="text-xs font-mono font-bold text-brand-text">Kod: {devCode}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-muted text-center block">Tasdiqlash kodi</label>
              <div className="flex justify-center gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-full max-w-[42px] aspect-square text-center bg-brand-surface2 border border-brand-line focus:border-brand-accent rounded-[10px] text-base sm:text-lg font-bold text-brand-text outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <span className="text-xs text-brand-dim">
                {canResend ? "Kodni qayta so'rash mumkin" : `Kodni qayta yuborish: ${formatTimer(timeLeft)}`}
              </span>
              
              <button 
                type="button"
                disabled={!canResend || loading}
                onClick={handleRequestOtp}
                className="text-xs text-brand-accent disabled:opacity-40 hover:underline font-semibold"
              >
                Kodni qayta yuborish
              </button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-50 text-[#06210F] font-semibold rounded-[14px] transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-accent-dim border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Kodni tasdiqlash</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Complete Profile (is_new) */}
        {step === 3 && (
          <form onSubmit={handleCompleteProfile} className="space-y-4" id="form-profile">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-brand-text text-center">Profilni to'ldirish</h3>
              <p className="text-[11px] text-brand-muted text-center">Siz tizimga birinchi marta kirdingiz. Iltimos ma'lumotlarni to'ldiring.</p>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Ism va familiyangiz</label>
              <input 
                type="text"
                placeholder="Ismingizni kiriting"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-12 px-4 bg-brand-surface2 border border-brand-line focus:border-brand-accent rounded-[12px] text-[16px] md:text-sm text-brand-text outline-none"
                required
              />
            </div>

            {/* Viloyat select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Viloyat</label>
              <select 
                value={viloyatId}
                onChange={(e) => setViloyatId(e.target.value)}
                className="w-full h-12 px-4 bg-brand-surface2 border border-brand-line focus:border-brand-accent rounded-[12px] text-[16px] md:text-sm text-brand-text outline-none"
                disabled={loading}
              >
                {viloyats.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            {/* Tuman select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Tuman yoki shahar</label>
              <select 
                value={tumanId}
                onChange={(e) => setTumanId(e.target.value)}
                className="w-full h-12 px-4 bg-brand-surface2 border border-brand-line focus:border-brand-accent rounded-[12px] text-[16px] md:text-sm text-brand-text outline-none disabled:opacity-40"
                disabled={loading || !viloyatId}
                required
              >
                <option value="">Tuman tanlang</option>
                {tumans.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Mahalla select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Mahalla (MFY)</label>
              <select 
                value={mahallaId}
                onChange={(e) => setMahallaId(e.target.value)}
                className="w-full h-12 px-4 bg-brand-surface2 border border-brand-line focus:border-brand-accent rounded-[12px] text-[16px] md:text-sm text-brand-text outline-none disabled:opacity-40"
                disabled={loading || !tumanId}
                required
              >
                <option value="">Mahalla tanlang</option>
                {mahallas.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Address detail */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-muted">Aniq manzil (uy, ko'cha nomi, xonadon)</label>
              <input 
                type="text"
                placeholder="Masalan: Tinchlik ko'chasi 12-uy"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                className="w-full h-12 px-4 bg-brand-surface2 border border-brand-line focus:border-brand-accent rounded-[12px] text-[16px] md:text-sm text-brand-text outline-none"
              />
            </div>

            <button 
              type="submit"
              disabled={loading || !mahallaId}
              className="w-full h-12 bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-50 text-[#06210F] font-semibold rounded-[14px] transition-all flex items-center justify-center mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-accent-dim border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Profilni yakunlash</span>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
