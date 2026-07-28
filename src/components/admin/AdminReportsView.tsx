import React, { useState } from 'react';
import * as Icons from 'lucide-react';

interface AdminReportsProps {
  user: any;
  adminToken: string;
}

export default function AdminReportsView({ user, adminToken }: AdminReportsProps) {
  const [reportType, setReportType] = useState("general");
  const [dateRange, setDateRange] = useState("month");
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3500);
  };

  const handleExport = (format: 'xlsx' | 'pdf') => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      triggerToast(`Hisobot muvaffaqiyatli ${format.toUpperCase()} formatida yuklab olindi.`);
    }, 1500);
  };

  // Mock reporting rows
  const reportsData = [
    { code: "REP-2026-07-28", name: "Viloyat miqyosida murojaatlar umumiy hisoboti", period: "Iyul 2026", generatedBy: "Sarvar Xorazmiy", size: "142 KB" },
    { code: "REP-2026-07-15", name: "Kommunal xizmatlar ijro samaradorligi auditi", period: "Kvartal Q2", generatedBy: "Bekzod Yusupov", size: "89 KB" },
    { code: "REP-2026-06-30", name: "SLA muddati buzilgan murojaatlar ro'yxati", period: "Iyun 2026", generatedBy: "Sarvar Xorazmiy", size: "210 KB" },
    { code: "REP-2026-06-15", name: "Yo'l va transport muammolari dinamika tahlili", period: "Iyun 2026", generatedBy: "Jasur Ergashiv", size: "115 KB" }
  ];

  return (
    <div className="space-y-4 max-w-[1200px] mx-auto pb-8 select-none font-medium">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#3DDC84]/15 border border-[#3DDC84]/30 text-[#3DDC84] px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 animate-fadeIn text-xs font-bold">
          <Icons.CheckCircle size={15} />
          <span>{toast}</span>
        </div>
      )}

      {/* Main configuration row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left config side */}
        <div className="lg:col-span-4 bg-brand-surface border border-brand-line p-5 rounded-xl space-y-4 h-fit">
          <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">Hisobotlarni shakllantirish</h3>

          {/* Selector 1 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">Hisobot turi</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full h-10 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs font-semibold text-brand-text focus:outline-none focus:border-brand-accent"
            >
              <option value="general">Umumiy yig'ma hisobot</option>
              <option value="sla">SLA muddatlari tahlili</option>
              <option value="agencies">Idoralararo solishtirma reyting</option>
              <option value="satisfaction">Fuqarolar qoniqish darajasi</option>
            </select>
          </div>

          {/* Selector 2 */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">Davriylik</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full h-10 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs font-semibold text-brand-text focus:outline-none focus:border-brand-accent"
            >
              <option value="week">Oxirgi 7 kunlik</option>
              <option value="month">Oxirgi 30 kunlik (Iyul)</option>
              <option value="quarter">Kvartal (Q2)</option>
              <option value="year">Yillik tahlil (2026)</option>
            </select>
          </div>

          {/* Dynamic Export Buttons */}
          <div className="pt-4 border-t border-brand-line/50 space-y-2">
            <button
              onClick={() => handleExport('xlsx')}
              disabled={generating}
              className="w-full h-10 bg-brand-accent hover:bg-brand-accent/90 disabled:opacity-40 text-white font-bold rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors shadow-sm"
            >
              {generating ? (
                <Icons.Loader size={13} className="animate-spin" />
              ) : (
                <>
                  <Icons.Download size={13} />
                  <span>Excel (XLSX) yuklab olish</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleExport('pdf')}
              disabled={generating}
              className="w-full h-10 bg-brand-surface2 hover:bg-brand-surface3 border border-brand-line text-brand-text font-bold rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors"
            >
              {generating ? (
                <Icons.Loader size={13} className="animate-spin" />
              ) : (
                <>
                  <Icons.FileText size={13} />
                  <span>PDF shaklida eksport qilish</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right list side */}
        <div className="lg:col-span-8 bg-brand-surface border border-brand-line rounded-xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-brand-line/60 bg-brand-surface2/40">
              <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">Arxivlangan hisobotlar jurnali</h3>
              <p className="text-[10px] text-brand-dim mt-0.5 uppercase tracking-wide">Ilgari shakllantirilgan va saqlangan hisobotlar ro'yxati</p>
            </div>

            <div className="divide-y divide-brand-line/40 text-xs">
              {reportsData.map((report, idx) => (
                <div key={idx} className="p-4 hover:bg-brand-surface2/30 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-brand-surface2 border border-brand-line text-brand-muted flex items-center justify-center shrink-0">
                      <Icons.FileSpreadsheet size={15} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-brand-text truncate leading-snug">{report.name}</h4>
                      <p className="text-[10px] text-brand-dim mt-0.5 font-medium uppercase">
                        Kodi: {report.code} · Davri: {report.period} · Tuzuvchi: {report.generatedBy}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0 pl-4">
                    <span className="text-[10px] text-brand-dim font-mono font-bold uppercase">{report.size}</span>
                    <button
                      onClick={() => handleExport('xlsx')}
                      className="w-8 h-8 rounded-lg hover:bg-brand-surface3 flex items-center justify-center text-brand-muted hover:text-brand-accent transition-colors"
                      title="Hisobotni yuklab olish"
                    >
                      <Icons.ArrowDownToLine size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-brand-line/50 bg-brand-surface2/20 text-[11px] text-brand-dim leading-relaxed">
            Hisobotlar viloyat Hokimligi tomonidan belgilangan tartib va me'yorlar asosida tayyorlanadi hamda barcha ko'rsatkichlar monitoring tizimi tomonidan avtomatik ravishda tekshiriladi.
          </div>
        </div>
      </div>
    </div>
  );
}
