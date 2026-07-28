import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { AgencyPerformance, Appeal, CATEGORIES } from '../types';
import CategoryIcon from './CategoryIcon';
import * as Icons from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Locale, getTranslation } from '../i18n';

const getCategoryColor = (key: string) => {
  const map: { [key: string]: string } = {
    street_lighting: "var(--cat-lighting)",
    water_supply: "var(--cat-water)",
    sewerage: "var(--cat-sewerage)",
    waste: "var(--cat-waste)",
    heating_gas: "var(--cat-gas)",
    roads: "var(--cat-roads)",
    healthcare: "var(--cat-health)",
    preschool_education: "var(--cat-school)",
    public_order: "var(--cat-order)",
    other: "var(--cat-other)"
  };
  return map[key] || "var(--cat-other)";
};

interface AgenciesViewProps {
  onNavigate: (view: string, params?: any) => void;
  locale: Locale;
}

export default function AgenciesView({ onNavigate, locale }: AgenciesViewProps) {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  // Filtering & Sorting states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "speed" | "rating">("name");

  // Public feeds and mapped appeal list for navigation
  const [publicFeed, setPublicFeed] = useState<any[]>([]);
  const [allAppeals, setAllAppeals] = useState<Appeal[]>([]);

  const agencyProfiles = [
    { 
      id: 1, 
      name: "Viloyat Hokimligi", 
      desc: "Umumiy tuman masalalari, fuqarolik ariza va shikoyatlari hamda boshqa idoralarga tegishli bo'lmagan maxsus masalalar.",
      contact: "+998 (62) 223-00-11",
      address: "Urganch sh., Al-Xorazmiy ko'chasi 23-uy",
      category: "other",
      manager: "X. Sobirov",
      email: "info@xorazm.uz"
    },
    { 
      id: 2, 
      name: "Kommunal Xizmatlar Boshqarmasi", 
      desc: "Elektr tarmoqlari, ko'cha chiroqlari, ichimlik suvi tarmoqlari, kanalizatsiya va oqova suv tizimlari, gaz ta'minoti.",
      contact: "+998 (62) 224-15-40",
      address: "Urganch sh., Baynalminal ko'chasi 5-uy",
      category: "street_lighting",
      manager: "A. Karimov",
      email: "kommunal@xorazm.uz"
    },
    { 
      id: 3, 
      name: "Sog'liqni Saqlash Boshqarmasi", 
      desc: "Poliklinikalar, shoshilinch tez yordam, dori-darmon ta'minoti, shifoxonalardagi xizmat sifati va tibbiy muammolar.",
      contact: "+998 (62) 226-00-03",
      address: "Urganch sh., Sog'liqni saqlash ko'chasi 1-uy",
      category: "healthcare",
      manager: "S. Atajonov",
      email: "ssb@xorazm.uz"
    },
    { 
      id: 4, 
      name: "Yo'llar va Transport Boshqarmasi", 
      desc: "Ichki va tashqi ko'chalarni asfaltlash, chuqurlarni ta'mirlash, svetoforlar, yo'l belgilari hamda jamoat transporti yo'nalishlari.",
      contact: "+998 (62) 228-40-10",
      address: "Urganch sh., Mustaqillik ko'chasi 140-uy",
      category: "roads",
      manager: "M. Safarov",
      email: "yollar@xorazm.uz"
    },
    { 
      id: 5, 
      name: "Maktabgacha va Maktab Ta'limi", 
      desc: "Bog'chalar va maktablardagi ta'lim sifati, isitish tizimlari, darsliklar yetishmovchiligi, moddiy-texnik holat.",
      contact: "+998 (62) 223-45-67",
      address: "Urganch sh., Fitrat ko'chasi 8-uy",
      category: "preschool_education",
      manager: "N. Quryazova",
      email: "maktab@xorazm.uz"
    },
    { 
      id: 6, 
      name: "Ichki Ishlar Boshqarmasi (Jamoat Tartibi)", 
      desc: "Mahallalardagi jamoat xavfsizligi, tungi osoyishtalik, ruxsatsiz shovqin, huquqbuzarliklar va profilaktika nazorati.",
      contact: "+998 (62) 223-01-02",
      address: "Urganch sh., Yoshlik ko'chasi 12-uy",
      category: "public_order",
      manager: "Polkovnik O. Sharipov",
      email: "iib@xorazm.uz"
    }
  ];

  useEffect(() => {
    Promise.all([
      api.get<{ items: AgencyPerformance[] }>("/api/public/agencies"),
      api.get<{ items: any[] }>("/api/public/feed"),
      api.get<{ items: Appeal[] }>("/api/me/appeals").catch(() => ({ items: [] }))
    ]).then(([agenciesRes, feedRes, appealsRes]) => {
      // Merge static profiles with dynamic performance results
      const merged = agencyProfiles.map(p => {
        const stats = agenciesRes.items.find(a => a.agency_id === p.id) || {
          total: 0,
          done: 0,
          overdue: 0,
          avg_resolution_days: 6.5,
          resolution_rate: 85,
          satisfaction_avg: 4.5
        };
        return {
          ...p,
          ...stats
        };
      });

      setAgencies(merged);
      setPublicFeed(feedRes.items || []);
      setAllAppeals(appealsRes.items || []);
      
      if (merged.length > 0) {
        setSelectedId(merged[0].id);
      }
      setLoading(false);
    }).catch(err => {
      console.warn("Failed to load agencies info:", err);
      setLoading(false);
    });
  }, []);

  const handleNavigateToAppeal = (trackingCode: string) => {
    const found = allAppeals.find(a => a.tracking_code === trackingCode);
    if (found) {
      onNavigate("appeals", { initialAppealId: found.id });
    } else {
      // Fallback search
      onNavigate("appeals", { searchQuery: trackingCode });
    }
  };

  const getFilteredAgencies = () => {
    let result = [...agencies];
    
    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q));
    }

    // Sort control
    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "speed") {
        return a.avg_resolution_days - b.avg_resolution_days; // Faster resolution is smaller days count
      }
      if (sortBy === "rating") {
        return b.satisfaction_avg - a.satisfaction_avg; // Higher average rating first
      }
      return 0;
    });

    return result;
  };

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating);
    return (
      <div className="flex items-center space-x-0.5 text-brand-accent">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Icons.Star 
            key={idx} 
            size={11} 
            className={idx < rounded ? "fill-brand-accent stroke-brand-accent" : "stroke-brand-line"} 
          />
        ))}
        <span className="text-[11px] text-brand-muted font-bold ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const filtered = getFilteredAgencies();
  const selectedAgency = agencies.find(a => a.id === selectedId);

  // Filter feed items for current agency
  const agencyFeed = selectedAgency ? publicFeed.filter(item => {
    // Match agency name loosely
    return item.agency.toLowerCase().includes(selectedAgency.name.toLowerCase().split(" ")[0].toLowerCase());
  }) : [];

  // Trend graph data simulation based on agency speed
  const getTrendData = (agency: any) => {
    if (!agency) return [];
    const baseDays = agency.avg_resolution_days;
    return [
      { name: "Fev", kun: Number((baseDays * 1.3).toFixed(1)) },
      { name: "Mar", kun: Number((baseDays * 1.2).toFixed(1)) },
      { name: "Apr", kun: Number((baseDays * 1.1).toFixed(1)) },
      { name: "May", kun: Number((baseDays * 1.05).toFixed(1)) },
      { name: "Iyun", kun: Number(baseDays.toFixed(1)) },
      { name: "Iyul", kun: Number((baseDays * 0.95).toFixed(1)) }
    ];
  };

  // Category distribution simulation
  const getCategoryDistribution = (agency: any) => {
    if (!agency) return [];
    // Dynamic list based on agency profile category
    if (agency.id === 2) {
      return [
        { label: "Ko'cha yoritish", count: Math.round(agency.total * 0.45) },
        { label: "Ichimlik suvi", count: Math.round(agency.total * 0.25) },
        { label: "Chiqindi", count: Math.round(agency.total * 0.20) },
        { label: "Gaz va issiqlik", count: Math.max(1, Math.round(agency.total * 0.10)) }
      ];
    }
    if (agency.id === 4) {
      return [
        { label: "Yo'l chuqurlari", count: Math.round(agency.total * 0.70) },
        { label: "Asfaltlash", count: Math.round(agency.total * 0.30) }
      ];
    }
    return [
      { label: CATEGORIES[agency.category]?.label || "Umumiy", count: agency.total }
    ];
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 py-6 space-y-6" id="agencies-master-detail">
      
      {/* Title */}
      <div className="space-y-1 pb-4 border-b border-brand-line/50">
        <h2 className="text-[26px] font-bold text-brand-text font-display leading-tight">{getTranslation(locale, "agencies_title")}</h2>
        <p className="text-xs text-brand-muted font-medium">{getTranslation(locale, "agencies_desc")}</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-12 gap-6 h-[600px]">
          <div className="col-span-4 bg-brand-surface border border-brand-line rounded-xl shimmer" />
          <div className="col-span-8 bg-brand-surface border border-brand-line rounded-xl shimmer" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* MASTER COLUMN (Left 35% on desktop = 4 cols) */}
          <div className={`lg:col-span-4 flex flex-col space-y-4 ${selectedId && "hidden lg:flex"}`}>
            
            {/* Search + Sort */}
            <div className="bg-brand-surface border border-brand-line rounded-xl p-3.5 space-y-3 shadow-sm">
              <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dim" size={14} />
                <input 
                  type="text"
                  placeholder={locale === 'uz' ? "Idorani qidirish..." : locale === 'ru' ? "Поиск ведомства..." : "Search agencies..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-brand-surface2 border border-brand-line focus:border-brand-accent/50 rounded-lg text-xs text-brand-text outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-brand-dim">
                <span>Saralash:</span>
                <div className="flex space-x-1">
                  {(['name', 'speed', 'rating'] as const).map(mode => (
                    <button 
                      key={mode}
                      onClick={() => setSortBy(mode)}
                      className={`px-2 py-1 rounded-md transition-all uppercase text-[9px] ${sortBy === mode ? 'bg-brand-accent-glow text-brand-accent' : 'hover:text-brand-text'}`}
                    >
                      {mode === 'name' ? 'A-Z' : mode === 'speed' ? 'Tezlik' : 'Reyting'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Agencies Card list */}
            <div className="flex-1 overflow-y-auto space-y-3 max-h-[680px] no-scrollbar">
              {filtered.map(agency => {
                const isSelected = agency.id === selectedId;
                return (
                  <div 
                    key={agency.id}
                    onClick={() => setSelectedId(agency.id)}
                    className={`p-4 rounded-xl cursor-pointer text-left space-y-3.5 card--tinted sado-card ${isSelected ? 'border-brand-accent ring-2 ring-brand-accent/20' : ''}`}
                    style={{ 
                      '--tint-a': `color-mix(in srgb, ${getCategoryColor(agency.category)} 10%, transparent)`
                    } as React.CSSProperties}
                  >
                    <div className="flex items-start space-x-3.5">
                      <CategoryIcon category={agency.category} className="!w-9 !h-9 rounded-[10px] shrink-0" size={14} />
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="text-xs font-extrabold text-brand-text leading-snug truncate">{agency.name}</h4>
                        {renderStars(agency.satisfaction_avg)}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-2.5 border-t border-brand-line/50 text-center text-[10px] font-bold text-brand-muted">
                      <div>
                        <span className="text-brand-dim block text-[9px] font-semibold">Murojaatlar</span>
                        <span className="text-brand-text">{agency.total} ta</span>
                      </div>
                      <div>
                        <span className="text-brand-dim block text-[9px] font-semibold">Bajarildi</span>
                        <span className="text-brand-accent">{agency.done} ta</span>
                      </div>
                      <div>
                        <span className="text-brand-dim block text-[9px] font-semibold">Kutish</span>
                        <span className="text-brand-text text-red-400">{agency.overdue} ta</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* DETAIL COLUMN (Right 65% on desktop = 8 cols) */}
          <div className={`lg:col-span-8 bg-brand-surface border border-brand-line rounded-xl p-6 flex flex-col space-y-6 ${!selectedId && "hidden lg:flex"}`}>
            
            {selectedAgency ? (
              <>
                {/* Mobile Back button */}
                <div className="lg:hidden flex items-center justify-between pb-3 border-b border-brand-line">
                  <button 
                    onClick={() => setSelectedId(null)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-brand-accent"
                  >
                    <Icons.ChevronLeft size={16} />
                    <span>Ortga</span>
                  </button>
                  <span className="text-[10px] font-mono text-brand-dim uppercase tracking-wider">{selectedAgency.category}</span>
                </div>

                {/* Top Section: Header identity card */}
                <div 
                  className="card--tinted p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  style={{ 
                    '--tint-a': `color-mix(in srgb, ${getCategoryColor(selectedAgency.category)} 12%, transparent)`
                  } as React.CSSProperties}
                >
                  <div className="flex items-start space-x-4">
                    <CategoryIcon category={selectedAgency.category} className="!w-12 !h-12 rounded-[12px]" size={18} />
                    <div className="space-y-1 text-left">
                      <h3 className="text-lg font-black text-brand-text font-display leading-tight">{selectedAgency.name}</h3>
                      <div className="flex items-center space-x-3 text-xs text-brand-muted">
                        <span>Mas'ul: <strong className="text-brand-text">{selectedAgency.manager}</strong></span>
                        <span>•</span>
                        {renderStars(selectedAgency.satisfaction_avg)}
                      </div>
                    </div>
                  </div>

                  {/* Contact button / card */}
                  <div className="bg-brand-surface2 border border-brand-line p-3 rounded-lg flex items-center space-x-3 text-xs text-left w-full md:w-auto">
                    <div className="w-8 h-8 rounded bg-brand-accent-glow flex items-center justify-center text-brand-accent">
                      <Icons.PhoneCall size={14} />
                    </div>
                    <div>
                      <span className="text-[9px] text-brand-dim uppercase font-bold tracking-wider block">Ishonch telefoni</span>
                      <strong className="text-brand-text font-mono">+{selectedAgency.contact}</strong>
                    </div>
                  </div>
                </div>

                {/* Middle section: KPI 4-cards analytics */}
                <div className="space-y-2 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-dim">Tahliliy hisobot (KPI)</span>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    <div className="bg-brand-surface2 border border-brand-line p-4 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-brand-dim uppercase tracking-wider block">Jami</span>
                      <p className="text-xl font-extrabold text-brand-text font-mono">{selectedAgency.total} <span className="text-[10px] text-brand-muted">ta</span></p>
                    </div>

                    <div className="bg-brand-surface2 border border-brand-line p-4 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-brand-dim uppercase tracking-wider block">Bajarilgan</span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xl font-extrabold text-brand-accent font-mono">{selectedAgency.done} <span className="text-[10px] text-brand-muted">ta</span></span>
                        <span className="text-[10px] text-brand-accent font-bold font-mono">+{selectedAgency.resolution_rate}%</span>
                      </div>
                    </div>

                    <div className="bg-brand-surface2 border border-brand-line p-4 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-brand-dim uppercase tracking-wider block">Muddati o'tgan</span>
                      <p className="text-xl font-extrabold text-red-400 font-mono">{selectedAgency.overdue} <span className="text-[10px] text-brand-muted">ta</span></p>
                    </div>

                    <div className="bg-brand-surface2 border border-brand-line p-4 rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-brand-dim uppercase tracking-wider block">O'rtacha muddat</span>
                      <p className="text-xl font-semibold text-[#A78BFA] font-mono">{selectedAgency.avg_resolution_days} <span className="text-[10px] text-brand-muted">kun</span></p>
                    </div>

                  </div>
                </div>

                {/* Graphs rows */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-left">
                  
                  {/* Resolution speed trend chart (7 cols) */}
                  <div className="md:col-span-7 bg-brand-surface2 border border-brand-line rounded-xl p-4 space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-dim block">Ijro muddatlari dinamikasi (Kun)</span>
                    <div className="h-44 w-full text-[10px] font-bold">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getTrendData(selectedAgency)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" opacity={0.2} vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--line)", borderRadius: "8px", fontSize: "11px" }}
                            labelStyle={{ color: "var(--text)" }}
                          />
                          <Bar dataKey="kun" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Horizontal category distributions (5 cols) */}
                  <div className="md:col-span-5 bg-brand-surface2 border border-brand-line rounded-xl p-4 space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-dim block">Tarkibiy taqsimot</span>
                    
                    <div className="space-y-2.5">
                      {getCategoryDistribution(selectedAgency).map((cat, idx) => {
                        const percent = selectedAgency.total > 0 ? Math.round((cat.count / selectedAgency.total) * 100) : 100;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px] font-extrabold">
                              <span className="text-brand-text">{cat.label}</span>
                              <span className="text-brand-dim font-mono">{cat.count} ta ({percent}%)</span>
                            </div>
                            <div className="h-2 bg-brand-surface rounded-full overflow-hidden">
                              <div className="h-full bg-brand-accent" style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Bottom section: Recent public appeals handled by agency */}
                <div className="space-y-3 text-left">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-dim block">So'nggi jamoat murojaatlari (Ochiq)</span>
                  
                  {agencyFeed.length === 0 ? (
                    <div className="py-6 text-center text-xs text-brand-dim border border-dashed border-brand-line rounded-xl">
                      Idoraga tegishli ochiq jamoat murojaatlari mavjud emas.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {agencyFeed.slice(0, 3).map((item, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleNavigateToAppeal(item.tracking_code)}
                          className="p-3 bg-brand-surface2 hover:bg-brand-surface3 border border-brand-line rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-4"
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[9px] font-extrabold text-brand-accent bg-brand-accent-glow px-1.5 py-0.2 rounded uppercase">{item.tracking_code}</span>
                              <span className="text-[9px] text-brand-dim">{item.mahalla}</span>
                            </div>
                            <h5 className="text-xs font-bold text-brand-text truncate leading-snug">{item.summary}</h5>
                          </div>

                          <div className="flex items-center space-x-3 shrink-0">
                            <span className="flex items-center space-x-1 text-[10px] font-extrabold text-brand-dim">
                              <Icons.Users size={11} className="text-brand-muted" />
                              <span>{item.cosign_count}</span>
                            </span>
                            <Icons.ChevronRight size={13} className="text-brand-dim" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </>
            ) : (
              <div className="py-24 text-center text-brand-muted text-xs font-bold">
                Tahlil hisobotini ko'rish uchun chap tomondan idorani tanlang.
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
