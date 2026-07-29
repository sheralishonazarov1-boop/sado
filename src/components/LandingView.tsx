import { useEffect, useState } from 'react';
import { api } from '../api';
import { PublicStats } from '../types';
import CategoryIcon from './CategoryIcon';
import * as Icons from 'lucide-react';
import SadoMark from './SadoMark';

interface LandingViewProps {
  onNavigate: (view: string) => void;
  locale?: any;
}

export default function LandingView({ onNavigate }: LandingViewProps) {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<PublicStats>("/api/public/stats")
      .then(res => {
        setStats(res);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch public stats:", err);
        setLoading(false);
      });
  }, []);

  const agenciesList = [
    { name: "Hokimlik", cat: "other" },
    { name: "Kommunal xizmat", cat: "street_lighting" },
    { name: "Sog'liqni saqlash", cat: "healthcare" },
    { name: "Yo'llar boshqarmasi", cat: "roads" },
    { name: "Maktabgacha ta'lim", cat: "preschool_education" },
    { name: "Ichki ishlar", cat: "public_order" }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-16 space-y-12 md:space-y-16 sado-page-transition" id="landing-container">
      {/* Header / Wordmark Section */}
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <SadoMark size={56} className="text-brand-accent animate-[pulse_3s_ease-in-out_infinite] mb-2" />
          <h2 className="text-3xl font-black tracking-[0.04em] text-brand-text font-display">SADO</h2>
          <p className="text-[11px] font-bold text-brand-dim uppercase tracking-[0.18em] block">FUQARO MUROJAATLARI PLATFORMASI</p>
          <span className="text-xs italic text-brand-muted mt-1 opacity-80">Ovozingiz eshitiladi.</span>
        </div>

        <div className="flex items-center space-x-2 bg-brand-surface2/50 px-4 py-1.5 rounded-full border border-brand-line">
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-accent">Xorazm Viloyati</span>
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-brand-text max-w-2xl font-display leading-tight" id="landing-headline">
          Murojaatingiz <span className="text-brand-accent">yo'qolmaydi.</span>
        </h1>
        
        <p className="text-base md:text-lg text-brand-muted max-w-xl leading-relaxed" id="landing-subline">
          Har bir murojaat avtomatik tarzda tahlil qilinadi, tegishli idoraga yo'naltiriladi va ijrosi to'liq ta'minlanguniga qadar nazorat qilinadi.
        </p>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
        <button 
          onClick={() => onNavigate("login")}
          className="w-full sm:w-auto px-8 h-[52px] bg-brand-accent hover:bg-brand-accent/90 text-[#06210F] font-semibold rounded-[14px] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-brand-accent/10 sado-btn sado-btn-primary"
          id="btn-send-appeal"
        >
          <Icons.FilePlus2 size={20} />
          <span>Murojaat yuborish</span>
        </button>
        <button 
          onClick={() => onNavigate("transparency")}
          className="w-full sm:w-auto px-8 h-[52px] border border-brand-line hover:bg-brand-surface2 text-brand-text font-semibold rounded-[14px] transition-all flex items-center justify-center space-x-2 sado-btn"
          id="btn-transparency"
        >
          <Icons.Eye size={20} />
          <span>Shaffoflik</span>
        </button>
      </div>

      {/* Public Counter Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 bg-brand-surface border border-brand-line rounded-[18px] p-6 md:p-8" id="stats-grid">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="space-y-3">
              <div className="h-10 w-24 shimmer rounded" />
              <div className="h-4 w-32 shimmer rounded" />
            </div>
          ))
        ) : (
          <>
            <div className="flex flex-col items-center md:items-start space-y-1">
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl md:text-4xl font-extrabold text-brand-text font-display">
                  {stats?.total || 0}
                </span>
                <span className="text-sm font-medium text-brand-muted">ta</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-dim text-center md:text-left">
                Umumiy murojaatlar
              </span>
            </div>

            <div className="flex flex-col items-center md:items-start space-y-1 border-t md:border-t-0 md:border-l border-brand-line pt-4 md:pt-0 md:pl-6">
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl md:text-4xl font-extrabold text-brand-accent font-display">
                  {stats?.by_status?.done || 0}
                </span>
                <span className="text-sm font-medium text-brand-muted">ta</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-dim text-center md:text-left">
                Muvaffaqiyatli hal etilgan
              </span>
            </div>

            <div className="flex flex-col items-center md:items-start space-y-1 border-t md:border-t-0 md:border-l border-brand-line pt-4 md:pt-0 md:pl-6">
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl md:text-4xl font-extrabold text-[#A78BFA] font-display">
                  {stats?.avg_resolution_days != null ? stats.avg_resolution_days : '—'}
                </span>
                {stats?.avg_resolution_days != null && <span className="text-sm font-medium text-brand-muted">kun</span>}
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-dim text-center md:text-left">
                {stats?.avg_resolution_days != null ? "O'rtacha hal etish muddati" : "Ma'lumot yetarli emas"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Agency chips carousel/grid */}
      <div className="space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-dim text-center">
          Tizimga ulangan oltita davlat idorasi
        </p>
        <div className="flex flex-wrap justify-center gap-3" id="agency-chips">
          {agenciesList.map((agency, idx) => (
            <div 
              key={idx} 
              className="flex items-center space-x-3 bg-brand-surface border border-brand-line px-4 py-2.5 rounded-[14px]"
            >
              <CategoryIcon category={agency.cat} size={16} className="!w-8 !height-8 rounded-[10px]" />
              <span className="text-sm font-medium text-brand-text">{agency.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Short 3 step strip */}
      <div className="border-t border-brand-line pt-8 md:pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center" id="three-steps-section">
        <div className="space-y-2 p-4">
          <div className="w-10 h-10 bg-brand-surface2 border border-brand-line rounded-full flex items-center justify-center mx-auto text-brand-accent font-extrabold font-display">1</div>
          <h3 className="text-[15px] font-semibold text-brand-text">Yozing</h3>
          <p className="text-xs text-brand-muted">Muammoingizni o'z so'zlaringiz bilan qisqa bayon qiling.</p>
        </div>
        <div className="space-y-2 p-4">
          <div className="w-10 h-10 bg-brand-surface2 border border-brand-line rounded-full flex items-center justify-center mx-auto text-brand-ai font-extrabold font-display">2</div>
          <h3 className="text-[15px] font-semibold text-brand-text">AI yo'naltiradi</h3>
          <p className="text-xs text-brand-muted">Sun'iy intellekt muammoni aniqlab, mas'ul idoraga yo'naltiradi.</p>
        </div>
        <div className="space-y-2 p-4">
          <div className="w-10 h-10 bg-brand-surface2 border border-brand-line rounded-full flex items-center justify-center mx-auto text-brand-accent font-extrabold font-display">3</div>
          <h3 className="text-[15px] font-semibold text-brand-text">Kuzatib boring</h3>
          <p className="text-xs text-brand-muted">Murojaatingizning holatini xarita va bosqichlar orqali kuzating.</p>
        </div>
      </div>
    </div>
  );
}
