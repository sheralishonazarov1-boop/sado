import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminApi } from '../../api';

interface AdminDashboardProps {
  user: any;
  onNavigate: (view: string, params?: any) => void;
  adminToken: string;
}

export default function AdminDashboardView({ user, onNavigate, adminToken }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [urgentAppeals, setUrgentAppeals] = useState<any[]>([]);
  const [teamLoad, setTeamLoad] = useState<any[]>([]);
  const [agencyRanking, setAgencyRanking] = useState<any[]>([]);
  const [recentAudit, setRecentAudit] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Get Stats Overview
      const statsData = await adminApi.get<any>("/api/admin/stats/overview");
      setStats(statsData);

      // 2. Get Appeals Queue (urgent, limit 8, not done)
      const appealsData = await adminApi.get<any>("/api/admin/appeals?limit=8&sort=deadline");
      setUrgentAppeals(appealsData.items?.filter((a: any) => a.status !== 'done') || []);

      // 3. Get Team Load Stats if not operator
      if (user.role !== 'operator') {
        const teamData = await adminApi.get<any>("/api/admin/stats/team");
        setTeamLoad(teamData.items || []);
      }

      // 4. Get Agencies Stats if super_admin
      if (user.role === 'super_admin') {
        const agenciesData = await adminApi.get<any>("/api/admin/stats/agencies");
        const sortedAgencies = (agenciesData.items || []).sort((a: any, b: any) => b.sla_rate - a.sla_rate);
        setAgencyRanking(sortedAgencies);

        // Fetch Audit Log for Row 4
        const auditData = await adminApi.get<any>("/api/admin/audit?limit=10");
        setRecentAudit(auditData.items || []);
      } else {
        // Mock recent activities relevant to agency
        setRecentAudit([
          { id: 1, actor_name: "Nilufar Qosimova", actor_role: "operator", action: "update_status", target_id: "1001", detail: "Murojaat holati Ijrodaga o'zgartirildi", created_at: "2026-07-28T08:05:00Z" },
          { id: 2, actor_name: "Bekzod Yusupov", actor_role: "agency_admin", action: "assign", target_id: "1002", detail: "Mas'ul biriktirildi: Nilufar", created_at: "2026-07-28T07:15:00Z" }
        ]);
      }
    } catch (err) {
      console.error("Dashboard statistics loading failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, adminToken]);

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Icons.Loader className="animate-spin text-brand-accent" size={32} />
        <span className="text-xs text-brand-muted font-semibold">Tahliliy hisobotlar yuklanmoqda...</span>
      </div>
    );
  }

  // Chart Color configuration based on design system
  const statusColors = {
    new: '#60A5FA',
    reviewing: '#FBBF24',
    in_progress: '#A78BFA',
    done: '#3DDC84',
    overdue: '#F87171'
  };

  const donutData = [
    { name: "Yangi", value: stats.by_status?.new || 0, color: statusColors.new },
    { name: "Ko'rib chiqilmoqda", value: stats.by_status?.reviewing || 0, color: statusColors.reviewing },
    { name: "Ijroda", value: stats.by_status?.in_progress || 0, color: statusColors.in_progress },
    { name: "Yakunlangan", value: stats.by_status?.done || 0, color: statusColors.done }
  ].filter(d => d.value > 0);

  // Format relative time
  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} (${d.getDate()} iyul)`;
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto pb-8">
      {/* ROW 1: 5 KPI TILES */}
      <div className="grid grid-cols-2 lg:grid-cols-12 gap-3.5">
        {/* KPI 1: Yangi */}
        <div className="col-span-1 lg:col-span-2 bg-brand-surface border border-brand-line p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-brand-dim uppercase tracking-wider">Yangi</span>
            <div className="w-6 h-6 rounded-md bg-[#60A5FA]/10 text-[#60A5FA] flex items-center justify-center">
              <Icons.Inbox size={12} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-brand-text font-display">{stats.by_status?.new || 0}</h3>
            <p className="text-[10px] font-bold text-brand-muted mt-1">Kutish rejimida</p>
          </div>
        </div>

        {/* KPI 2: Ijroda */}
        <div className="col-span-1 lg:col-span-2 bg-brand-surface border border-brand-line p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-brand-dim uppercase tracking-wider">Ijroda</span>
            <div className="w-6 h-6 rounded-md bg-[#A78BFA]/10 text-[#A78BFA] flex items-center justify-center">
              <Icons.Clock size={12} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-brand-text font-display">{stats.by_status?.in_progress || 0}</h3>
            <p className="text-[10px] font-bold text-brand-muted mt-1">Hozirda jarayonda</p>
          </div>
        </div>

        {/* KPI 3: Muddati O'tgan */}
        <div className="col-span-1 lg:col-span-2 bg-brand-surface border border-[#F87171]/20 p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#F87171] uppercase tracking-wider">Muddati o'tgan</span>
            <div className="w-6 h-6 rounded-md bg-[#F87171]/10 text-[#F87171] flex items-center justify-center">
              <Icons.AlertTriangle size={12} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-[#F87171] font-display">{stats.overdue_count}</h3>
            <p className="text-[10px] font-bold text-brand-muted mt-1">Nazorat muddatidan o'tdi</p>
          </div>
        </div>

        {/* KPI 4: Tayinlanmagan */}
        <div className="col-span-1 lg:col-span-2 bg-brand-surface border border-brand-line p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-brand-dim uppercase tracking-wider">Tayinlanmagan</span>
            <div className="w-6 h-6 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Icons.UserX size={12} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-brand-text font-display">{stats.unassigned_count}</h3>
            <p className="text-[10px] font-bold text-brand-muted mt-1">Mas'ul biriktirilmagan</p>
          </div>
        </div>

        {/* KPI 5: SLA Bajarilishi (Wider Tile) */}
        <div className="col-span-2 lg:col-span-4 bg-brand-surface border border-brand-line p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-brand-dim uppercase tracking-wider">SLA bajarilishi</span>
            <div className="w-6 h-6 rounded-md bg-brand-accent/10 text-brand-accent flex items-center justify-center">
              <Icons.Activity size={12} />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-1">
              <h3 className="text-2xl font-extrabold text-brand-text font-display">{stats.sla_rate}%</h3>
              <span className="text-[10px] font-bold text-brand-dim">/ Maqsad 90%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-brand-surface2 h-1.5 rounded-full mt-2.5 overflow-hidden border border-brand-line/50">
              <div
                className="bg-brand-accent h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.sla_rate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: CHART AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Area chart: Received vs Resolved */}
        <div className="lg:col-span-7 bg-brand-surface border border-brand-line p-4 rounded-xl">
          <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-4">Ijro dinamikasi (6 oylik)</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand-accent, #3DDC84)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--color-brand-accent, #3DDC84)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-brand-line, #2A352E)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--color-brand-dim, #63736B)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-brand-dim, #63736B)" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-brand-surface, #131A16)',
                    borderColor: 'var(--color-brand-line, #2A352E)',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                />
                <Area type="monotone" name="Murojaat tushdi" dataKey="received" stroke="var(--color-brand-accent, #3DDC84)" strokeWidth={2} fillOpacity={1} fill="url(#colorReceived)" />
                <Area type="monotone" name="Hal etildi" dataKey="resolved" stroke="var(--color-brand-dim, #63736B)" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut chart: Holat Taqsimoti */}
        <div className="lg:col-span-5 bg-brand-surface border border-brand-line p-4 rounded-xl flex flex-col justify-between">
          <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-2">Holat taqsimoti</h3>
          {donutData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-brand-dim">Ma'lumot yetarli emas</div>
          ) : (
            <div className="flex items-center justify-around h-[160px]">
              <div className="w-[140px] h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 min-w-[120px]">
                {donutData.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: entry.color }}></span>
                      <span className="text-brand-muted text-[11px] truncate max-w-[90px]">{entry.name}</span>
                    </div>
                    <span className="text-brand-text font-bold font-mono pl-2">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ROW 3: COMPACT TABLES / WORKLOADS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Side Panel: Idoralar reytingi (super_admin) OR Shoshilinch murojaatlar (other roles) */}
        {user.role === 'super_admin' ? (
          <div className="lg:col-span-8 bg-brand-surface border border-brand-line p-4 rounded-xl">
            <div className="flex items-center justify-between mb-4 border-b border-brand-line/50 pb-2">
              <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">Idoralar reytingi (Accountability)</h3>
              <span className="text-[10px] font-bold text-brand-accent uppercase bg-brand-accent/10 px-2 py-0.5 rounded">Eng kuchli nazorat</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-line text-[11px] text-brand-dim font-bold uppercase tracking-wider">
                    <th className="pb-2.5">Idora</th>
                    <th className="pb-2.5">SLA darajasi</th>
                    <th className="pb-2.5 text-center">Jami</th>
                    <th className="pb-2.5 text-center">Muddati o'tgan</th>
                    <th className="pb-2.5 text-right">O'rtacha muddat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line/40 text-xs font-medium">
                  {agencyRanking.map((agency, idx) => (
                    <tr key={idx} className="hover:bg-brand-surface2/40 transition-colors h-[42px] group">
                      <td className="py-2.5 font-bold text-brand-text flex items-center space-x-2">
                        <span className="text-[10px] font-mono text-brand-dim w-4">{idx + 1}.</span>
                        <span className="group-hover:text-brand-accent transition-colors truncate max-w-[150px]">{agency.agency}</span>
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center space-x-2.5">
                          <span className="font-mono font-bold w-10">{agency.sla_rate}%</span>
                          <div className="w-20 bg-brand-surface2 h-1.5 rounded-full overflow-hidden border border-brand-line/40">
                            <div className="bg-brand-accent h-full rounded-full" style={{ width: `${agency.sla_rate}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-center font-mono text-brand-muted">{agency.total}</td>
                      <td className="py-2.5 text-center font-mono">
                        <span className={agency.overdue > 0 ? 'text-[#F87171] font-bold' : 'text-brand-dim'}>{agency.overdue}</span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-brand-muted">{agency.avg_resolution_days} kun</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 bg-brand-surface border border-brand-line p-4 rounded-xl">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-4">Shoshilinch murojaatlar</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brand-line text-[11px] text-brand-dim font-bold uppercase">
                    <th className="pb-2">Kodi</th>
                    <th className="pb-2">Qisqacha mazmuni</th>
                    <th className="pb-2">Muhimlik</th>
                    <th className="pb-2">Mas'ul</th>
                    <th className="pb-2 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-line/50 text-xs">
                  {urgentAppeals.map((appeal, idx) => (
                    <tr key={idx} className="hover:bg-brand-surface2/50 h-[44px] relative">
                      <td className="py-2 font-mono font-semibold text-brand-accent">{appeal.tracking_code}</td>
                      <td className="py-2 truncate max-w-[200px] text-brand-text font-medium">{appeal.summary}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          appeal.priority === 'high' ? 'bg-[#F87171]/10 text-[#F87171]' : 'bg-brand-muted/10 text-brand-muted'
                        }`}>
                          {appeal.priority_label}
                        </span>
                      </td>
                      <td className="py-2 text-brand-muted">{appeal.assigned_to?.full_name || <span className="text-brand-dim">Tayinlanmagan</span>}</td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => onNavigate('appeals', { detailId: appeal.id })}
                          className="text-[11px] font-bold text-brand-accent hover:underline"
                        >
                          Ko'rish
                        </button>
                      </td>
                    </tr>
                  ))}
                  {urgentAppeals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-brand-dim">Faol shoshilinch murojaatlar mavjud emas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Right Side: Xodimlar yuklamasi (hidden for operators) */}
        {user.role !== 'operator' && (
          <div className="lg:col-span-4 bg-brand-surface border border-brand-line p-4 rounded-xl flex flex-col justify-between">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-4">Xodimlar yuklamasi</h3>
            <div className="space-y-4 overflow-y-auto flex-1 max-h-[220px] pr-1">
              {teamLoad.map((staff, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-brand-text">{staff.full_name}</span>
                    <span className="font-mono text-brand-muted">{staff.assigned} ta faol</span>
                  </div>
                  {/* Load visual bar */}
                  <div className="w-full bg-brand-surface2 h-2 rounded-full overflow-hidden border border-brand-line/40">
                    <div
                      className="bg-brand-accent h-full rounded-full"
                      style={{ width: `${Math.min(100, (staff.assigned / 10) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {teamLoad.length === 0 && (
                <p className="text-xs text-brand-dim text-center py-6">Xodimlar topilmadi.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ROW 4: REGIONAL AUDIT / RECENT ACTIONS */}
      <div className="grid grid-cols-1 gap-3.5">
        <div className="bg-brand-surface border border-brand-line p-4 rounded-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-brand-line/50">
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">So'nggi harakatlar</h3>
            <button
              onClick={() => onNavigate('audit')}
              className="text-[11px] font-bold text-brand-accent hover:underline flex items-center space-x-1"
            >
              <span>Barcha jurnallar</span>
              <Icons.ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-3.5">
            {recentAudit.map((log, idx) => (
              <div key={idx} className="flex items-start justify-between text-xs border-b border-brand-line/30 pb-2.5 last:border-0 last:pb-0 font-medium">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="w-7 h-7 rounded bg-brand-surface2 text-brand-dim flex items-center justify-center font-bold shrink-0">
                    <Icons.Shield size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-brand-text truncate">
                      <span className="font-bold text-brand-accent mr-1.5">{log.actor_name}</span>
                      <span className="text-brand-muted">{log.detail}</span>
                    </p>
                    <p className="text-[10px] text-brand-dim mt-0.5 uppercase tracking-wide">
                      Rol: {log.actor_role} · Turi: {log.target_type}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-brand-dim shrink-0 pl-4">{formatTime(log.created_at)}</span>
              </div>
            ))}
            {recentAudit.length === 0 && (
              <p className="text-xs text-brand-dim text-center py-4">So'nggi harakatlar mavjud emas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
