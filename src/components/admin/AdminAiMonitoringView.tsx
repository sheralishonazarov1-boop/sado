import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { adminApi } from '../../api';

interface AdminAiMonitoringProps {
  adminToken: string;
}

export default function AdminAiMonitoringView({ adminToken }: AdminAiMonitoringProps) {
  const [loading, setLoading] = useState(true);
  const [aiData, setAiData] = useState<any>(null);

  const fetchAiData = async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<any>("/api/admin/stats/ai");
      setAiData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiData();
  }, [adminToken]);

  if (loading || !aiData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
        <Icons.Loader className="animate-spin text-brand-ai mx-auto" size={24} />
        <span className="text-xs text-brand-muted font-bold">Sun'iy intellekt tahlili yuklanmoqda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-[1200px] mx-auto pb-8 select-none font-medium">
      {/* 1. Header Hero block (Restricted Violet styling) */}
      <div className="p-5 rounded-xl border border-[#A78BFA]/30 bg-[#A78BFA]/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-full bg-[#A78BFA]/20 text-[#A78BFA] flex items-center justify-center shadow-lg shadow-[#A78BFA]/5 shrink-0">
            <Icons.Cpu size={22} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-[#A78BFA] tracking-widest uppercase">Intellektual Marshrutlash</span>
            <h2 className="text-sm font-bold text-brand-text mt-0.5">SADO AI: Avtomatik Tasniflash Tizimi</h2>
            <p className="text-xs text-brand-muted mt-0.5 leading-relaxed">
              Murojaat matnini tahlil qilish, toifani aniqlash va tegishli ijrochi idoraga yo'naltirish Gemini 1.5 Flash modeli tomonidan boshqariladi.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center space-x-1.5 px-3 py-1.5 bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20 rounded-xl text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-[#3DDC84] animate-ping"></span>
          <span>Sistem Onlayn</span>
        </div>
      </div>

      {/* 2. KPIs row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* KPI 1 */}
        <div className="bg-brand-surface border border-brand-line p-4 rounded-xl">
          <div className="flex items-center justify-between text-brand-dim text-[11px] font-bold uppercase">
            <span>Jami tasniflangan</span>
            <Icons.Layers size={13} className="text-[#A78BFA]" />
          </div>
          <h3 className="text-2xl font-extrabold text-brand-text font-display mt-3">{aiData.total_classified} ta</h3>
          <p className="text-[10px] text-brand-dim mt-1.5 font-bold uppercase tracking-wide">Oxirgi 30 kunda</p>
        </div>

        {/* KPI 2 */}
        <div className="bg-brand-surface border border-brand-line p-4 rounded-xl">
          <div className="flex items-center justify-between text-brand-dim text-[11px] font-bold uppercase">
            <span>AI Qabul qilish darajasi</span>
            <Icons.ThumbsUp size={13} className="text-[#3DDC84]" />
          </div>
          <h3 className="text-2xl font-extrabold text-brand-text font-display mt-3 text-[#3DDC84]">{aiData.acceptance_rate}%</h3>
          <p className="text-[10px] text-brand-dim mt-1.5 font-bold uppercase tracking-wide">Operator tasdiqlagan</p>
        </div>

        {/* KPI 3 */}
        <div className="bg-brand-surface border border-brand-line p-4 rounded-xl">
          <div className="flex items-center justify-between text-brand-dim text-[11px] font-bold uppercase">
            <span>O'rtacha ishonch koeffitsiyenti</span>
            <Icons.CheckCircle2 size={13} className="text-[#A78BFA]" />
          </div>
          <h3 className="text-2xl font-extrabold text-brand-text font-display mt-3 text-[#A78BFA]">{Math.round(aiData.avg_confidence * 100)}%</h3>
          <p className="text-[10px] text-brand-dim mt-1.5 font-bold uppercase tracking-wide">Model ishonchliligi</p>
        </div>
      </div>

      {/* 3. Breakdown Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Left Side: Confidence Buckets */}
        <div className="lg:col-span-5 bg-brand-surface border border-brand-line p-4 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-4 flex items-center space-x-1.5">
              <Icons.BarChart3 size={14} className="text-[#A78BFA]" />
              <span>Ishonchlilik taqsimoti</span>
            </h3>
            <div className="space-y-4">
              {aiData.confidence_buckets.map((bucket: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-brand-muted">{bucket.bucket} ishonch</span>
                    <span className="text-brand-text font-mono font-bold">{bucket.count} ta</span>
                  </div>
                  <div className="w-full bg-brand-surface2 h-1.5 rounded-full overflow-hidden border border-brand-line/40">
                    <div
                      className="bg-[#A78BFA] h-full rounded-full"
                      style={{ width: `${(bucket.count / 85) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[10px] text-brand-dim leading-relaxed border-t border-brand-line/50 pt-3 mt-4">
            90% dan yuqori ishonchlilikka ega murojaatlar avtomatlashtirilgan tarzda inson aralashuvisiz to'g'ridan-to'g'ri ijro etuvchi idoraga yuboriladi.
          </p>
        </div>

        {/* Right Side: Category Accuracy Table */}
        <div className="lg:col-span-7 bg-brand-surface border border-brand-line p-4 rounded-xl">
          <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider mb-4 flex items-center space-x-1.5">
            <Icons.Compass size={14} className="text-[#A78BFA]" />
            <span>Toifalar bo'yicha aniqlik</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-line text-[11px] text-brand-dim font-bold uppercase tracking-wider h-8">
                  <th className="pb-2">Toifa</th>
                  <th className="pb-2 text-center">Tavsiya etildi</th>
                  <th className="pb-2 text-center">Rad etildi</th>
                  <th className="pb-2 text-right">Aniqlik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line/40 text-xs">
                {aiData.by_category.map((cat: any, idx: number) => (
                  <tr key={idx} className="hover:bg-brand-surface2/30 h-[38px] transition-colors">
                    <td className="py-2 text-brand-text font-bold">{cat.category_label}</td>
                    <td className="py-2 text-center font-mono text-brand-muted">{cat.suggested}</td>
                    <td className="py-2 text-center font-mono text-brand-dim">{cat.overridden}</td>
                    <td className="py-2 text-right">
                      <span className={`font-mono font-extrabold ${
                        cat.accuracy >= 90 ? 'text-[#3DDC84]' : cat.accuracy >= 70 ? 'text-[#FBBF24]' : 'text-[#F87171]'
                      }`}>
                        {cat.accuracy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
