import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { adminApi } from '../../api';

interface AdminAuditProps {
  adminToken: string;
}

export default function AdminAuditView({ adminToken }: AdminAuditProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/audit", window.location.origin);
      if (actionFilter) url.searchParams.append("action", actionFilter);
      const data = await adminApi.get<any>(`${url.pathname}${url.search}`);
      setLogs(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [adminToken, actionFilter]);

  const filteredLogs = logs.filter(log => {
    if (!searchTerm.trim()) return true;
    const s = searchTerm.toLowerCase();
    return (
      log.actor_name.toLowerCase().includes(s) ||
      log.detail.toLowerCase().includes(s) ||
      log.action.toLowerCase().includes(s) ||
      log.target_type.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4 max-w-[1200px] mx-auto pb-8 select-none font-medium">
      {/* Top filter and header area */}
      <div className="bg-brand-surface border border-brand-line rounded-xl p-4 flex flex-wrap items-center justify-between gap-3.5">
        <div>
          <h2 className="text-xs font-bold text-brand-text uppercase tracking-wider">Hokimlik nazorati jurnali (Audit)</h2>
          <p className="text-[10px] text-brand-dim mt-0.5 uppercase tracking-wide">Xodimlarning barcha tizimdagi harakatlari va ruxsatnomalari to'liq yozib boriladi</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-9 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs font-semibold text-brand-text focus:outline-none"
          >
            <option value="">Barcha harakatlar</option>
            <option value="login">Tizimga kirish</option>
            <option value="assign">Mas'ul biriktirish</option>
            <option value="reassign">Idoraga yo'naltirish</option>
            <option value="create_user">Xodim yaratish</option>
            <option value="update_status">Holat o'zgarishi</option>
          </select>

          {/* Search */}
          <div className="relative w-48">
            <Icons.Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dim" />
            <input
              type="text"
              placeholder="Ism, izoh qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-8.5 pr-3 rounded-lg bg-brand-surface2 border border-brand-line text-xs text-brand-text placeholder-brand-dim focus:outline-none font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Audit List Container */}
      <div className="bg-brand-surface border border-brand-line rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <Icons.Loader className="animate-spin text-brand-accent mx-auto" size={24} />
              <p className="text-xs text-brand-muted font-bold mt-2">Audit jurnali yuklanmoqda...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="p-12 text-center text-xs text-brand-dim">Harakatlar qaydlari topilmadi.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-line text-[11px] text-brand-dim font-bold uppercase tracking-wider bg-brand-surface2/30 h-10">
                  <th className="p-3 pl-4">Xodim</th>
                  <th className="p-3 w-32">Roli</th>
                  <th className="p-3 w-36">Amal</th>
                  <th className="p-3 w-32">Nishon turi</th>
                  <th className="p-3">Harakat tafsiloti</th>
                  <th className="p-3 pr-4 text-right w-44">Sana va vaqt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line/40 text-xs font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-brand-surface2/25 h-[46px] transition-colors">
                    <td className="p-3 pl-4 font-bold text-brand-text">{log.actor_name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-surface2 border border-brand-line text-brand-muted">
                        {log.actor_role?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-semibold font-mono text-brand-accent">{log.action}</td>
                    <td className="p-3 text-brand-dim font-semibold capitalize">{log.target_type}</td>
                    <td className="p-3 text-brand-muted leading-relaxed truncate max-w-[340px]" title={log.detail}>
                      {log.detail}
                    </td>
                    <td className="p-3 pr-4 text-right font-mono text-brand-dim">
                      {new Date(log.created_at).toLocaleString('uz-UZ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
