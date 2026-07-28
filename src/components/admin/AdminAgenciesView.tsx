import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { adminApi } from '../../api';

interface AdminAgenciesProps {
  adminToken: string;
}

export default function AdminAgenciesView({ adminToken }: AdminAgenciesProps) {
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<any>("/api/admin/stats/agencies");
      setAgencies(data.items || []);
    } catch (err) {
      console.error("Agencies load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, [adminToken]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
        <Icons.Loader className="animate-spin text-brand-accent" size={24} />
        <span className="text-xs text-brand-muted font-bold">Idoralar yuklanmoqda...</span>
      </div>
    );
  }

  // Find the top performer based on SLA Rate
  const topAgency = agencies.length > 0
    ? [...agencies].sort((a, b) => b.sla_rate - a.sla_rate)[0]
    : null;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-8 select-none">
      {/* Top performer highlight board */}
      {topAgency && (
        <div className="p-5 bg-brand-accent/10 border border-brand-accent/30 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center">
              <Icons.Award size={22} className="animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-brand-accent tracking-widest uppercase">Viloyatda Eng Yuqori Natija</span>
              <h2 className="text-sm font-bold text-brand-text mt-0.5">{topAgency.agency}</h2>
              <p className="text-xs text-brand-muted mt-0.5">SLA darajasi {topAgency.sla_rate}% ni tashkil etdi, o'rtacha ijro muddati {topAgency.avg_resolution_days} kun.</p>
            </div>
          </div>
          <div className="shrink-0 bg-brand-surface border border-brand-line p-2.5 px-4 rounded-xl text-center">
            <span className="text-[10px] text-brand-dim font-bold block uppercase">O'rtacha baho</span>
            <span className="text-sm font-extrabold text-brand-text font-mono flex items-center justify-center space-x-1 mt-0.5">
              <span>{topAgency.satisfaction_avg}</span>
              <Icons.Star size={11} className="text-amber-500 fill-amber-500" />
            </span>
          </div>
        </div>
      )}

      {/* Main Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agencies.map((agency, idx) => {
          const isTop = topAgency?.agency_id === agency.agency_id;
          return (
            <div
              key={idx}
              className={`bg-brand-surface border rounded-xl p-5 flex flex-col justify-between transition-shadow relative ${
                isTop ? 'border-brand-accent/50 shadow-lg shadow-brand-accent/5' : 'border-brand-line'
              }`}
            >
              {isTop && (
                <span className="absolute top-3 right-3 bg-brand-accent/15 text-brand-accent text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                  Eng faol
                </span>
              )}

              {/* Identity */}
              <div>
                <h3 className="text-xs font-bold text-brand-text uppercase tracking-wide truncate max-w-[85%]">
                  {agency.agency}
                </h3>
                <p className="text-[10px] text-brand-dim mt-0.5 font-bold uppercase tracking-wider">
                  Idora ID: #{agency.agency_id}
                </p>

                {/* Main SLA rating progress */}
                <div className="mt-5 space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-brand-muted">SLA bajarilishi</span>
                    {agency.total > 0 ? (
                      <span className="text-brand-text font-mono">{agency.sla_rate}%</span>
                    ) : (
                      <span className="text-brand-muted text-[10px]">Ma'lumot yetarli emas</span>
                    )}
                  </div>
                  <div className="w-full bg-brand-surface2 h-1.5 rounded-full overflow-hidden border border-brand-line/40">
                    <div
                      className="bg-brand-accent h-full rounded-full transition-all duration-300"
                      style={{ width: agency.total > 0 ? `${agency.sla_rate}%` : '0%' }}
                    ></div>
                  </div>
                </div>

                {/* Grid performance details */}
                <div className="grid grid-cols-2 gap-3.5 mt-5 pt-4 border-t border-brand-line/40 text-xs">
                  <div>
                    <span className="text-brand-dim text-[10px] font-bold uppercase block">Jami murojaat</span>
                    <span className="text-brand-text font-mono font-bold block mt-1">{agency.total} ta</span>
                  </div>
                  <div>
                    <span className="text-brand-dim text-[10px] font-bold uppercase block">Hal etilgan</span>
                    <span className="text-brand-text font-mono font-bold block mt-1 text-[#3DDC84]">{agency.done} ta</span>
                  </div>
                  <div>
                    <span className="text-brand-dim text-[10px] font-bold uppercase block">Muddati o'tgan</span>
                    <span className={`font-mono font-bold block mt-1 ${agency.overdue > 0 ? 'text-[#F87171]' : 'text-brand-muted'}`}>
                      {agency.overdue} ta
                    </span>
                  </div>
                  <div>
                    <span className="text-brand-dim text-[10px] font-bold uppercase block">O'rtacha muddat</span>
                    <span className="text-brand-text font-mono font-bold block mt-1">
                      {agency.total > 0 ? `${agency.avg_resolution_days} kun` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider and Actions */}
              <div className="mt-5 pt-4 border-t border-brand-line/40 flex items-center justify-between text-xs font-bold">
                <span className="text-brand-dim">Faoliyat: Faol</span>
                <span className="text-brand-accent flex items-center space-x-1 hover:underline cursor-pointer">
                  <span>Nazorat hisoboti</span>
                  <Icons.ArrowRight size={12} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
