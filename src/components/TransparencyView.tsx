import { useEffect, useState } from 'react';
import { api } from '../api';
import { PublicStats, AgencyPerformance, PublicFeedItem } from '../types';
import CategoryIcon from './CategoryIcon';
import * as Icons from 'lucide-react';

export default function TransparencyView() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [agencies, setAgencies] = useState<AgencyPerformance[]>([]);
  const [feed, setFeed] = useState<PublicFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sorting state for agencies
  const [sortBy, setSortBy] = useState<keyof AgencyPerformance>('total');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    Promise.all([
      api.get<PublicStats>("/api/public/stats"),
      api.get<{ items: AgencyPerformance[] }>("/api/public/agencies"),
      api.get<{ items: PublicFeedItem[] }>("/api/public/feed")
    ]).then(([statsRes, agenciesRes, feedRes]) => {
      setStats(statsRes);
      setAgencies(agenciesRes.items);
      setFeed(feedRes.items);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load transparency data:", err);
      setLoading(false);
    });
  }, []);

  const handleSort = (field: keyof AgencyPerformance) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedAgencies = [...agencies].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    if (typeof aVal === 'string') {
      aVal = (aVal as string).toLowerCase();
      bVal = (bVal as string).toLowerCase();
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusPillColor = (status: string) => {
    switch (status) {
      case "new": return "var(--st-new)";
      case "reviewing": return "var(--st-reviewing)";
      case "in_progress": return "var(--st-progress)";
      case "done": return "var(--st-done)";
      default: return "var(--text-muted)";
    }
  };

  const renderStars = (rating: number) => {
    const rounded = Math.round(rating);
    return (
      <div className="flex items-center space-x-0.5 text-brand-accent">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Icons.Star 
            key={idx} 
            size={12} 
            className={idx < rounded ? "fill-brand-accent stroke-brand-accent" : "stroke-brand-dim"} 
          />
        ))}
        <span className="text-xs text-brand-muted ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-12" id="transparency-container">
      {/* Page Title */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-brand-text font-display">Shaffoflik Platformasi</h2>
        <p className="text-sm text-brand-muted">Xorazm viloyati davlat idoralarining murojaatlar bilan ishlash hisoboti va real vaqtdagi faoliyat ko'rsatkichlari.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-brand-surface border border-brand-line rounded-[18px] p-5 space-y-3">
              <div className="h-4 w-16 shimmer rounded" />
              <div className="h-8 w-24 shimmer rounded" />
            </div>
          ))
        ) : (
          <>
            {/* KPI 1 */}
            <div className="bg-brand-surface border border-brand-line rounded-[18px] p-5 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-dim">Murojaatlar</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-extrabold text-brand-text font-display">{stats?.total || 0}</span>
                <span className="text-xs text-brand-muted">ta</span>
              </div>
            </div>
            {/* KPI 2 */}
            <div className="bg-brand-surface border border-brand-line rounded-[18px] p-5 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-accent">Bajarilgan</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-extrabold text-brand-accent font-display">{stats?.by_status?.done || 0}</span>
                <span className="text-xs text-brand-muted">ta</span>
              </div>
            </div>
            {/* KPI 3 */}
            <div className="bg-brand-surface border border-brand-line rounded-[18px] p-5 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-ai">Muddat buzilgan</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-extrabold text-[#F87171] font-display">{stats?.overdue_count || 0}</span>
                <span className="text-xs text-brand-muted">ta</span>
              </div>
            </div>
            {/* KPI 4 */}
            <div className="bg-brand-surface border border-brand-line rounded-[18px] p-5 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-dim">AI tasniflash</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-extrabold text-[#A78BFA] font-display">{stats?.ai_classified_percent || 0}%</span>
                <span className="text-xs text-brand-muted">aniqlik</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Agency Performance Table */}
      <div className="bg-brand-surface border border-brand-line rounded-[18px] overflow-hidden" id="performance-table-card">
        <div className="p-5 border-b border-brand-line flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-brand-text font-display">Idoralar samaradorlik ko'rsatkichlari</h3>
          <span className="text-xs text-brand-dim">Ustun sarlavhasini bosib saralang</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" id="agency-table">
            <thead className="bg-brand-surface2 border-b border-brand-line text-brand-muted text-xs uppercase font-semibold">
              <tr>
                <th className="p-4 cursor-pointer hover:text-brand-text transition-colors" onClick={() => handleSort('agency')}>
                  Idora nomi {sortBy === 'agency' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="p-4 text-center cursor-pointer hover:text-brand-text transition-colors" onClick={() => handleSort('total')}>
                  Jami {sortBy === 'total' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="p-4 text-center cursor-pointer hover:text-brand-text transition-colors" onClick={() => handleSort('done')}>
                  Bajarilgan {sortBy === 'done' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="p-4 text-center cursor-pointer hover:text-brand-text transition-colors" onClick={() => handleSort('resolution_rate')}>
                  Bajarilish darajasi {sortBy === 'resolution_rate' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="p-4 text-center cursor-pointer hover:text-brand-text transition-colors" onClick={() => handleSort('avg_resolution_days')}>
                  O'rtacha muddat {sortBy === 'avg_resolution_days' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="p-4 text-right cursor-pointer hover:text-brand-text transition-colors" onClick={() => handleSort('satisfaction_avg')}>
                  Baholash {sortBy === 'satisfaction_avg' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-brand-line">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="hover:bg-brand-surface2/50">
                    <td className="p-4"><div className="h-4 w-32 shimmer rounded" /></td>
                    <td className="p-4 text-center"><div className="h-4 w-10 shimmer rounded mx-auto" /></td>
                    <td className="p-4 text-center"><div className="h-4 w-10 shimmer rounded mx-auto" /></td>
                    <td className="p-4"><div className="h-2 w-24 shimmer rounded mx-auto" /></td>
                    <td className="p-4 text-center"><div className="h-4 w-10 shimmer rounded mx-auto" /></td>
                    <td className="p-4 text-right"><div className="h-4 w-16 shimmer rounded ml-auto" /></td>
                  </tr>
                ))
              ) : (
                sortedAgencies.map((agency) => (
                  <tr key={agency.agency_id} className="hover:bg-brand-surface2/50 transition-colors">
                    <td className="p-4 font-semibold text-brand-text flex items-center space-x-3">
                      <CategoryIcon category={agency.agency_id === 1 ? 'other' : agency.agency_id === 2 ? 'street_lighting' : agency.agency_id === 3 ? 'healthcare' : agency.agency_id === 4 ? 'roads' : agency.agency_id === 5 ? 'preschool_education' : 'public_order'} size={14} className="!w-7 !h-7 rounded-[8px]" />
                      <span>{agency.agency}</span>
                    </td>
                    <td className="p-4 text-center font-display font-medium text-brand-text">{agency.total}</td>
                    <td className="p-4 text-center font-display font-medium text-brand-accent">{agency.done}</td>
                    <td className="p-4">
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <span className="text-xs font-semibold font-display text-brand-text">{agency.resolution_rate}%</span>
                        <div className="w-24 h-1.5 bg-brand-surface2 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-accent rounded-full" style={{ width: `${agency.resolution_rate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center font-mono text-xs text-brand-muted">{agency.avg_resolution_days} kun</td>
                    <td className="p-4 text-right">{renderStars(agency.satisfaction_avg)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Feed Feed */}
      <div className="space-y-4" id="live-feed-card">
        <div className="flex items-center space-x-2">
          <Icons.Activity size={18} className="text-brand-accent" />
          <h3 className="text-[17px] font-semibold text-brand-text font-display">Tizimdagi so'nggi murojaatlar</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-brand-surface border border-brand-line rounded-[18px] p-5 space-y-4">
                <div className="flex justify-between">
                  <div className="h-4 w-24 shimmer rounded" />
                  <div className="h-5 w-16 shimmer rounded" />
                </div>
                <div className="h-10 w-full shimmer rounded" />
              </div>
            ))
          ) : (
            feed.map((item, idx) => {
              const pillColor = getStatusPillColor(item.status);
              return (
                <div key={idx} className="bg-brand-surface border border-brand-line rounded-[18px] p-5 space-y-4 hover:border-brand-line/85 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-brand-dim tracking-wider">{item.tracking_code}</span>
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center space-x-1"
                      style={{ backgroundColor: `${pillColor}20`, color: pillColor }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: pillColor }} />
                      {item.status_label}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-brand-text line-clamp-2">{item.summary}</p>
                    <div className="flex items-center space-x-2 text-xs text-brand-muted">
                      <span className="bg-brand-surface2 px-2 py-0.5 rounded">{item.category_label}</span>
                      <span>•</span>
                      <span>{item.mahalla}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-brand-line text-xs text-brand-dim">
                    <span className="flex items-center space-x-1 text-brand-accent">
                      <Icons.Users size={12} />
                      <span>{item.cosign_count} kishi qo'shildi</span>
                    </span>
                    <span>{new Date(item.created_at).toLocaleDateString('uz-UZ')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
