import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { UserStats, Appeal, Region, CATEGORIES } from '../types';
import CategoryIcon from './CategoryIcon';
import * as Icons from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Locale, getTranslation, getNestedTranslation } from '../i18n';
import { NoMahallaAppealsIllustration } from './SadoIllustrations';
import { formatDaysCount } from '../utils';

interface DashboardViewProps {
  user: any;
  onNavigate: (view: string, params?: any) => void;
  locale: Locale;
}

export default function DashboardView({ user, onNavigate, locale }: DashboardViewProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [mahallaAppeals, setMahallaAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionsList, setRegionsList] = useState<Region[]>([]);
  const [cosignLoading, setCosignLoading] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<UserStats>("/api/me/stats"),
      api.get<{ items: Region[] }>("/api/regions"),
      user.mahalla_id ? api.get<{ items: Appeal[] }>(`/api/appeals/similar?mahalla_id=${user.mahalla_id}`) : Promise.resolve({ items: [] })
    ]).then(([statsRes, regionsRes, mahallaRes]) => {
      setStats(statsRes);
      setRegionsList(regionsRes.items);
      
      // Filter out user's own appeals from the mahalla discovery
      const others = mahallaRes.items.filter(a => !a.has_cosigned);
      setMahallaAppeals(others);
      
      setLoading(false);
    }).catch(err => {
      console.warn("Failed to load dashboard data:", err);
      setLoading(false);
    });
  }, [user]);

  const mahallaLabel = regionsList.find(r => r.id === user.mahalla_id)?.name || "Al-Xorazmiy MFY";
  const tumanLabel = regionsList.find(r => r.id === user.tuman_id)?.name || "Urganch shahri";
  const firstName = user.full_name ? user.full_name.split(" ")[0] : "Fuqaro";

  const handleCosign = async (id: number) => {
    setCosignLoading(id);
    try {
      await api.post(`/api/appeals/${id}/cosign`);
      setMahallaAppeals(prev => prev.filter(a => a.id !== id));
      const updatedStats = await api.get<UserStats>("/api/me/stats");
      setStats(updatedStats);
      onNavigate("appeals", { activeAppealId: id });
    } catch (err) {
      console.error("Failed to join appeal:", err);
    } finally {
      setCosignLoading(null);
    }
  };

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

  // Status mapping
  const statusColors = {
    new: "var(--st-new)",
    reviewing: "var(--st-reviewing)",
    in_progress: "var(--st-progress)",
    done: "var(--st-done)"
  };

  // Mock relative times for activity log
  const mockActivities = [
    { type: 'done', text: locale === 'uz' ? "Murojaat muvaffaqiyatli hal qilindi" : locale === 'ru' ? "Обращение успешно решено" : "Appeal successfully resolved", time: "2 soat oldin", status: 'done' },
    { type: 'progress', text: locale === 'uz' ? "Mutaxassis ko'rik o'tkazish uchun yuborildi" : locale === 'ru' ? "Специалист отправлен для проверки" : "Specialist dispatched for inspection", time: "5 soat oldin", status: 'in_progress' },
    { type: 'review', text: locale === 'uz' ? "Yangi ariza mas'ul idoraga yo'naltirildi" : locale === 'ru' ? "Новая заявка направлена ведомству" : "New application routed to agency", time: "1 kun oldin", status: 'reviewing' }
  ];

  // Dynamic submitted vs resolved over last 6 months
  const userTotal = stats?.total_count || 0;
  const userDone = stats?.by_status?.done || 0;
  const dynamicsData = [
    { name: 'Fev', submitted: 1, resolved: 0 },
    { name: 'Mar', submitted: 2, resolved: 1 },
    { name: 'Apr', submitted: Math.max(1, userTotal - 2), resolved: Math.max(0, userDone - 1) },
    { name: 'May', submitted: Math.max(1, userTotal - 1), resolved: Math.max(0, userDone - 1) },
    { name: 'Iyun', submitted: userTotal, resolved: userDone },
    { name: 'Iyul', submitted: userTotal, resolved: userDone }
  ];

  // Donut slices from actual categories stats
  const donutData = stats?.by_category ? Object.entries(stats.by_category)
    .filter(([_, val]) => (val as number) > 0)
    .map(([key, val]) => ({
      name: CATEGORIES[key]?.label || key,
      value: val as number,
      color: getCategoryColor(key)
    })) : [];

  const hasNoAppeals = !stats || stats.total_count === 0;

  if (loading) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-6 py-6 space-y-6">
        <div className="h-16 shimmer rounded-xl" />
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-8 h-40 shimmer rounded-xl" />
          <div className="col-span-4 h-40 shimmer rounded-xl" />
        </div>
        <div className="grid grid-cols-12 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="col-span-3 h-24 shimmer rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate indicator difference
  const userAvg = stats?.avg_resolution_days || 0;
  const regionalAvg = 6.8;
  const isFaster = userAvg <= regionalAvg;
  const avgDiff = Math.abs(userAvg - regionalAvg).toFixed(1);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 py-6 space-y-6" id="dashboard-view-v2">
      
      {/* Row 1: Greeting Header Area */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-brand-line/50 gap-4">
        <div className="space-y-1">
          <h2 className="text-[24px] md:text-[32px] font-bold text-brand-text font-display leading-tight">
            {getTranslation(locale, "dash_greeting")}, {firstName}!
          </h2>
          <div className="text-[13px] md:text-sm text-brand-muted flex items-center space-x-1.5 font-medium">
            <Icons.MapPin size={13} className="text-brand-accent" />
            <span>{tumanLabel}, {mahallaLabel}</span>
          </div>
        </div>

        <button 
          onClick={() => onNavigate("new-appeal")}
          className="hidden md:flex items-center justify-center space-x-2 px-5 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-white font-bold rounded-xl transition-all self-start md:self-auto shadow-lg shadow-brand-accent/10 sado-btn sado-btn-primary"
        >
          <Icons.Plus size={16} strokeWidth={2.5} />
          <span>{getTranslation(locale, "nav_new_appeal")}</span>
        </button>
      </div>

      {/* Row 2: Deadline Card (span 8) & Performance comparison Card (span 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Next Deadline Card (span 8) */}
        <div className="lg:col-span-8">
          {stats?.next_deadline ? (() => {
            const days = stats.next_deadline.days_left;
            let dlColor = "var(--accent)";
            let dlIcon = null;
            let dlLabel = "IJRO MUDDATI";
            
            if (days < 0) {
              dlColor = "var(--st-overdue)";
              dlIcon = <Icons.AlertTriangle size={13} />;
              dlLabel = "MUDDATI O'TGAN";
            } else if (days <= 1) {
              dlColor = "var(--st-overdue)";
              dlIcon = <Icons.AlertTriangle size={13} />;
              dlLabel = "MUDDAT TUGAYAPTI";
            } else if (days <= 3) {
              dlColor = "var(--st-reviewing)";
              dlIcon = <Icons.Clock size={13} />;
              dlLabel = "IJRO MUDDATI";
            }

            return (
              <div 
                onClick={() => onNavigate("appeals", { activeAppealId: stats.next_deadline?.appeal_id })}
                className="bg-brand-surface border border-brand-line rounded-xl p-6 space-y-4 cursor-pointer hover:border-brand-accent/30 transition-all h-full flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <span 
                      className="text-[11px] font-[800] uppercase tracking-[0.08em] flex items-center space-x-1"
                      style={{ color: dlColor }}
                    >
                      {dlIcon}
                      <span>{dlLabel}</span>
                    </span>
                    <h3 className="text-sm font-bold text-brand-text font-mono tracking-wider">{stats.next_deadline.tracking_code}</h3>
                  </div>
                  
                  <div className="whitespace-nowrap shrink-0 flex items-baseline">
                    <span 
                      className="text-[28px] font-[800] font-display" 
                      style={{ color: dlColor }}
                    >
                      {days < 0 ? Math.abs(days) : days}
                    </span>
                    <span className="text-[14px] text-brand-muted font-medium ml-1">
                      {days < 0 ? "kun o'tdi" : "kun qoldi"}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full h-2 bg-brand-surface2 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300" 
                      style={{ 
                        backgroundColor: dlColor,
                        width: `${Math.max(10, Math.min(100, days < 0 ? 100 : (7 - days) * 14))}%` 
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-brand-dim font-medium">
                    <span>Yuborilgan sanadan 7 kun muddat</span>
                    <span>Ijroga topshirilgan</span>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="bg-brand-surface border border-brand-line rounded-xl p-6 flex flex-col justify-center items-center text-center h-full space-y-2 min-h-[140px]">
              <div className="w-10 h-10 rounded-full bg-brand-accent-dim/20 flex items-center justify-center text-brand-accent">
                <Icons.CheckCircle size={20} />
              </div>
              <p className="text-xs font-semibold text-brand-text">Muddati yaqinlashayotgan arizalar yo'q</p>
              <p className="text-[11px] text-brand-dim">Barcha jarayonlar o'z vaqtida nazorat ostida ketmoqda.</p>
            </div>
          )}
        </div>

        {/* performance Indicator Card (span 4) */}
        <div className="lg:col-span-4">
          <div className="bg-brand-surface border border-brand-line rounded-xl p-6 h-full flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-brand-dim">
                {getTranslation(locale, "dash_stats_title")}
              </h3>
              <p className="text-[11px] text-brand-muted font-medium leading-relaxed">
                {getTranslation(locale, "dash_stats_desc")}
              </p>
            </div>

            <div className="flex items-center justify-between py-2 border-y border-brand-line/40 my-2">
              <div className="text-center">
                <span className="text-2xl font-extrabold font-display text-brand-text block">{userAvg ? formatDaysCount(userAvg) : '—'}</span>
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wide">{getTranslation(locale, "dash_your_avg")}</span>
              </div>
              <div className="text-center">
                <span className="text-2xl font-extrabold font-display text-brand-muted block">{formatDaysCount(regionalAvg)}</span>
                <span className="text-[10px] text-brand-muted font-bold uppercase tracking-wide">{getTranslation(locale, "dash_regional_avg")}</span>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-1.5 py-1.5 bg-brand-surface2/30 rounded-lg border border-brand-line/30 mt-1">
              {userAvg > 0 ? (
                userAvg === regionalAvg ? (
                  <span className="text-xs font-bold text-brand-muted">
                    Hududiy o'rtacha bilan bir xil
                  </span>
                ) : isFaster ? (
                  <div className="flex items-center space-x-1 text-brand-accent font-bold text-xs">
                    <Icons.ArrowDown size={14} strokeWidth={2.5} />
                    <span>{avgDiff} kun tezroq</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-red-500 font-bold text-xs" style={{ color: 'var(--st-overdue)' }}>
                    <Icons.ArrowUp size={14} strokeWidth={2.5} />
                    <span>{avgDiff} kun sekinroq</span>
                  </div>
                )
              ) : (
                <span className="text-xs text-brand-dim font-medium">{getTranslation(locale, "no_data")}</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Four Status counters - height reduced by 30%, single line number + label, top status colored border */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-4" id="status-counters-section">
        {(['new', 'reviewing', 'in_progress', 'done'] as const).map((st) => {
          const color = statusColors[st];
          const count = stats?.by_status?.[st] || 0;
          return (
            <div 
              key={st}
              onClick={() => onNavigate("appeals", { filterStatus: st })}
              className="lg:col-span-3 bg-brand-surface hover:bg-brand-surface2 border border-brand-line hover:border-brand-accent/25 px-4 py-3.5 rounded-xl transition-all cursor-pointer flex items-center justify-between"
              style={{ borderTop: `3px solid ${color}` }}
            >
              <span className="text-xs font-bold text-brand-muted">{getTranslation(locale, `status_${st}`)}</span>
              <span className="text-2xl font-black font-display text-brand-text">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Rows 4 & 5 conditional collapse to Onboarding Card if zero appeals */}
      {hasNoAppeals ? (
        <div className="bg-brand-surface border border-brand-line rounded-xl p-8 text-center max-w-4xl mx-auto space-y-6">
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-brand-accent-glow flex items-center justify-center text-brand-accent mx-auto">
              <Icons.Sparkles size={28} />
            </div>
            <h3 className="text-lg font-bold text-brand-text font-display">{getTranslation(locale, "dash_onboarding_title")}</h3>
            <p className="text-xs text-brand-muted">{getTranslation(locale, "dash_onboarding_desc")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left pt-2">
            <div className="bg-brand-surface2 border border-brand-line p-5 rounded-xl space-y-2">
              <div className="text-xs font-extrabold text-brand-accent">STEP 01</div>
              <h4 className="text-xs font-bold text-brand-text">{getTranslation(locale, "dash_onboarding_step1")}</h4>
              <p className="text-[11px] text-brand-dim leading-relaxed">Muammoning manzili va fotosuratini aniq kiritish orqali hal qilish imkoniyatini oshiring.</p>
            </div>
            <div className="bg-brand-surface2 border border-brand-line p-5 rounded-xl space-y-2">
              <div className="text-xs font-extrabold text-brand-accent">STEP 02</div>
              <h4 className="text-xs font-bold text-brand-text">{getTranslation(locale, "dash_onboarding_step2")}</h4>
              <p className="text-[11px] text-brand-dim leading-relaxed">Sun'iy intellekt murojaat mazmunini o'rganib chiqib, mas'ul davlat idorasini avtomatik tanlaydi.</p>
            </div>
            <div className="bg-brand-surface2 border border-brand-line p-5 rounded-xl space-y-2">
              <div className="text-xs font-extrabold text-brand-accent">STEP 03</div>
              <h4 className="text-xs font-bold text-brand-text">{getTranslation(locale, "dash_onboarding_step3")}</h4>
              <p className="text-[11px] text-brand-dim leading-relaxed">Yuborilgan arizangizning xronologik ijro holatini xaritada hamda doimiy yangilanishlarda kuzating.</p>
            </div>
          </div>
          
          <button 
            onClick={() => onNavigate("new-appeal")}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-brand-accent hover:bg-brand-accent/90 text-white font-bold rounded-xl transition-all"
          >
            <Icons.Plus size={16} />
            <span>{getTranslation(locale, "nav_new_appeal")}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Row 4: So'nggi harakatlar (span 5) & Murojaatlar dinamikasi Area Chart (span 7) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* So'nggi harakatlar (span 5) */}
            <div className="lg:col-span-5">
              <div className="bg-brand-surface border border-brand-line rounded-xl p-5 space-y-4 h-full flex flex-col justify-between">
                <div className="flex items-center space-x-2 pb-2 border-b border-brand-line/40">
                  <Icons.Activity size={15} className="text-brand-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text">
                    {getTranslation(locale, "dash_recent_activities")}
                  </h3>
                </div>

                <div className="flex-1 space-y-4 relative py-2 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-line/50">
                  {mockActivities.map((act, idx) => {
                    const statusColor = statusColors[act.status as keyof typeof statusColors] || 'var(--text-dim)';
                    return (
                      <div key={idx} className="flex items-start space-x-4 relative">
                        <div className="w-6.5 h-6.5 rounded-full border-2 border-brand-bg flex items-center justify-center shrink-0 z-10" style={{ backgroundColor: statusColor }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-bg" />
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="text-xs font-semibold text-brand-text truncate">{act.text}</p>
                          <span className="text-[10px] text-brand-dim font-medium block">{act.time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Murojaatlar dinamikasi Area Chart (span 7) */}
            <div className="lg:col-span-7">
              <div className="bg-brand-surface border border-brand-line rounded-xl p-5 space-y-3 h-full flex flex-col justify-between">
                <div className="flex items-center space-x-2 pb-2 border-b border-brand-line/40">
                  <Icons.TrendingUp size={15} className="text-brand-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text">
                    {getTranslation(locale, "dash_dynamics")}
                  </h3>
                </div>

                <div className="h-56 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dynamicsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSubmit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                      <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={10} tickLine={false} />
                      <YAxis stroke="var(--text-dim)" fontSize={10} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface-2)', borderColor: 'var(--line)', borderRadius: '8px' }}
                        labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text)' }}
                        itemStyle={{ fontSize: '11px', color: 'var(--text-muted)' }}
                      />
                      <Area 
                        name={getTranslation(locale, "dash_submitted")}
                        type="monotone" 
                        dataKey="submitted" 
                        stroke="var(--accent)" 
                        fillOpacity={1} 
                        fill="url(#colorSubmit)" 
                        strokeWidth={1.5}
                      />
                      <Area 
                        name={getTranslation(locale, "dash_resolved")}
                        type="monotone" 
                        dataKey="resolved" 
                        stroke="var(--st-done)" 
                        fillOpacity={0}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>

          {/* Row 5: Mahallangizda open appeals (span 7) & Toifalar bo'yicha donut chart (span 5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Mahallangizda open appeals (span 7) */}
            <div className="lg:col-span-7">
              <div className="bg-brand-surface border border-brand-line rounded-xl p-5 space-y-4 h-full flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 border-b border-brand-line/40">
                  <div className="flex items-center space-x-2">
                    <Icons.Users size={15} className="text-brand-accent" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text">
                      {getTranslation(locale, "dash_in_neighborhood")}
                    </h3>
                  </div>
                  <span className="text-[9px] bg-brand-accent-glow border border-brand-accent/25 px-2 py-0.5 rounded-full text-brand-accent font-extrabold uppercase tracking-wider select-none">
                    {mahallaLabel}
                  </span>
                </div>

                {mahallaAppeals.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-brand-line/60 rounded-xl space-y-3 min-h-[220px]">
                    <NoMahallaAppealsIllustration />
                    <p className="text-xs font-semibold text-brand-text">Mahallada qo'shiladigan arizalar yo'q</p>
                    <p className="text-[11px] text-brand-dim">Siz mahalladagi barcha jamoat tashabbuslarini qo'llab-quvvatladingiz.</p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                    {mahallaAppeals.slice(0, 4).map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-brand-surface2 border border-brand-line/60 p-3 rounded-xl flex items-center justify-between space-x-4 hover:border-brand-accent/20 transition-all"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <CategoryIcon category={item.category} className="!w-8.5 !h-8.5 rounded-lg shrink-0" size={14} />
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-xs font-bold text-brand-text truncate">{item.summary}</p>
                            <span className="text-[10px] text-brand-dim font-medium block truncate">Tashabbuschi: {item.location.address_detail}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          <span className="text-[10px] text-brand-dim font-bold flex items-center space-x-1 shrink-0">
                            <Icons.PlusCircle size={11} className="text-brand-accent" />
                            <span>{item.cosign_count}</span>
                          </span>
                          
                          <button
                            onClick={() => handleCosign(item.id)}
                            disabled={cosignLoading === item.id}
                            className="px-2.5 py-1 bg-brand-accent text-white hover:bg-brand-accent/90 text-[10px] font-bold rounded-lg transition-colors flex items-center space-x-1 sado-btn sado-btn-primary"
                          >
                            {cosignLoading === item.id ? (
                              <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span>{getTranslation(locale, "join")}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Toifalar bo'yicha Donut Chart (span 5) */}
            <div className="lg:col-span-5">
              <div className="bg-brand-surface border border-brand-line rounded-xl p-5 space-y-4 h-full flex flex-col justify-between">
                <div className="flex items-center space-x-2 pb-2 border-b border-brand-line/40">
                  <Icons.PieChart size={15} className="text-brand-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-text">
                    {getTranslation(locale, "dash_by_category")}
                  </h3>
                </div>

                {donutData.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-brand-line/60 rounded-xl space-y-2 min-h-[220px]">
                    <span className="text-xs text-brand-dim font-semibold">{getTranslation(locale, "no_data")}</span>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-4 py-1">
                    {/* Donut graphic */}
                    <div className="w-32 h-32 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={50}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {donutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-1.5 flex-1 max-w-[160px] overflow-hidden">
                      {donutData.slice(0, 5).map((entry, index) => (
                        <div key={index} className="flex items-center justify-between text-[11px] font-semibold space-x-2">
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                            <span className="text-brand-muted truncate block">{entry.name}</span>
                          </div>
                          <span className="text-brand-text font-mono shrink-0">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
