import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { Appeal, CATEGORIES, STATUSES } from '../types';
import CategoryIcon from './CategoryIcon';
import * as Icons from 'lucide-react';
import { Locale, getTranslation } from '../i18n';
import { NoAppealsIllustration } from './SadoIllustrations';

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

interface AppealsListViewProps {
  initialFilterStatus?: string;
  initialAppealId?: number | null;
  onClearParams: () => void;
  locale: Locale;
}

export default function AppealsListView({ 
  initialFilterStatus = "", 
  initialAppealId = null, 
  onClearParams,
  locale
}: AppealsListViewProps) {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter parameters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatus, setActiveStatus] = useState(initialFilterStatus);
  const [activeCategory, setActiveCategory] = useState("");
  const [displayMode, setDisplayMode] = useState<"list" | "grid">("list");

  // Detailed Modal States
  const [selectedAppeal, setSelectedAppeal] = useState<any | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingHoverStars, setRatingHoverStars] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [cosignLoading, setCosignLoading] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Load Appeals list
  const fetchAppeals = () => {
    setLoading(true);
    let url = `/api/me/appeals?status=${activeStatus}&category=${activeCategory}&q=${encodeURIComponent(searchQuery)}`;
    api.get<{ items: Appeal[] }>(url)
      .then(res => {
        setAppeals(res.items || []);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Appeals loading error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAppeals();
  }, [activeStatus, activeCategory, searchQuery]);

  // Open initial appeal if passed from other views
  useEffect(() => {
    if (initialAppealId) {
      handleOpenDetail(initialAppealId);
      onClearParams();
    }
  }, [initialAppealId]);

  // Handle ESC key to close modal/lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxOpen) {
          setLightboxOpen(false);
        } else {
          setSelectedAppeal(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  // Handle opening details modal
  const handleOpenDetail = (id: number) => {
    setModalLoading(true);
    setSelectedAppeal(null);
    api.get<any>(`/api/appeals/${id}`)
      .then(res => {
        setSelectedAppeal(res);
        setRatingStars(res.rating_stars || 0);
        setRatingComment(res.rating_comment || "");
        setModalLoading(false);
      })
      .catch(err => {
        console.warn("Failed to load appeal details:", err);
        setModalLoading(false);
      });
  };

  // Co-signing toggle
  const handleCosignToggle = async () => {
    if (!selectedAppeal) return;
    setCosignLoading(true);
    const id = selectedAppeal.id;
    try {
      if (selectedAppeal.has_cosigned) {
        const res = await api.delete<any>(`/api/appeals/${id}/cosign`);
        setSelectedAppeal((prev: any) => ({
          ...prev,
          cosign_count: res.cosign_count,
          has_cosigned: res.has_cosigned,
          can_cosign: res.can_cosign,
          timeline: [...prev.timeline, { label: locale === 'uz' ? "Imzo o'chirildi" : locale === 'ru' ? "Подпись убрана" : "Sign revoked", note: locale === 'uz' ? "Imzo muvaffaqiyatli bekor qilindi" : "Подпись успешно отозвана", time: new Date().toISOString() }]
        }));
      } else {
        const res = await api.post<any>(`/api/appeals/${id}/cosign`);
        setSelectedAppeal((prev: any) => ({
          ...prev,
          cosign_count: res.cosign_count,
          has_cosigned: res.has_cosigned,
          can_cosign: res.can_cosign,
          timeline: [...prev.timeline, { label: locale === 'uz' ? "Imzo qo'shildi" : locale === 'ru' ? "Подпись добавлена" : "Sign added", note: locale === 'uz' ? "Mahalladan ovoz qo'shildi" : "Подпись успешно добавлена", time: new Date().toISOString() }]
        }));
      }
      
      // Refresh list in background
      let url = `/api/me/appeals?status=${activeStatus}&category=${activeCategory}&q=${encodeURIComponent(searchQuery)}`;
      const freshList = await api.get<{ items: Appeal[] }>(url);
      setAppeals(freshList.items || []);
    } catch (err) {
      console.warn("Cosign error:", err);
    } finally {
      setCosignLoading(false);
    }
  };

  // Submit evaluation ratings
  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppeal || ratingStars === 0) return;

    setRatingSubmitting(true);
    try {
      const res = await api.post<any>(`/api/appeals/${selectedAppeal.id}/rating`, {
        stars: ratingStars,
        comment: ratingComment.trim()
      });
      
      setSelectedAppeal((prev: any) => ({
        ...prev,
        rating_stars: res.rating_stars,
        rating_comment: res.rating_comment,
        timeline: [...prev.timeline, { label: locale === 'uz' ? "Baholandi" : locale === 'ru' ? "Оценено" : "Rated", note: `${ratingStars} yulduzcha`, time: new Date().toISOString() }]
      }));

      let url = `/api/me/appeals?status=${activeStatus}&category=${activeCategory}&q=${encodeURIComponent(searchQuery)}`;
      const freshList = await api.get<{ items: Appeal[] }>(url);
      setAppeals(freshList.items || []);
    } catch (err) {
      console.warn("Submit rating failed:", err);
    } finally {
      setRatingSubmitting(false);
    }
  };

  const getStatusPillColor = (status: string) => {
    switch (status) {
      case "new": return "var(--st-new)";
      case "reviewing": return "var(--st-reviewing)";
      case "in_progress": return "var(--st-progress)";
      case "done": return "var(--st-done)";
      default: return "var(--text-muted)";
    }
  };

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 py-6 space-y-6 relative" id="appeals-list-v2">
      
      {/* Title block */}
      <div className="space-y-1 pb-4 border-b border-brand-line/50">
        <h2 className="text-[26px] font-bold text-brand-text font-display leading-tight">{getTranslation(locale, "appeals_list_title")}</h2>
        <p className="text-xs text-brand-muted font-medium">{getTranslation(locale, "appeals_list_desc")}</p>
      </div>

      {/* Filters: Denser row control */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 bg-brand-surface border border-brand-line p-3 rounded-xl shadow-sm">
        
        {/* Search input (flex-grow) */}
        <div className="relative flex-1">
          <Icons.Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dim" size={15} />
          <input 
            type="text"
            placeholder={getTranslation(locale, "search_by_code")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-brand-surface2 border border-brand-line focus:border-brand-accent/50 rounded-lg text-[16px] md:text-xs text-brand-text outline-none transition-colors"
          />
        </div>

        {/* Segmented Control for status */}
        <div className="relative shrink-0 w-full xl:w-auto">
          <div 
            className="flex bg-brand-surface2 border border-brand-line rounded-lg p-0.5 overflow-x-auto no-scrollbar scroll-smooth shrink-0 whitespace-nowrap"
            style={{
              maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)'
            }}
          >
            <button 
              onClick={() => setActiveStatus("")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap ${!activeStatus ? 'bg-brand-accent text-white shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}
            >
              {locale === 'uz' ? 'Barchasi' : locale === 'ru' ? 'Все' : 'All'}
            </button>
            {(['new', 'reviewing', 'in_progress', 'done'] as const).map(st => (
              <button 
                key={st}
                onClick={() => setActiveStatus(st)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all whitespace-nowrap ${activeStatus === st ? 'bg-brand-surface3 text-brand-accent shadow-sm' : 'text-brand-muted hover:text-brand-text'}`}
              >
                {getTranslation(locale, `status_${st}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Category Select Dropdown */}
        <div className="relative shrink-0">
          <select 
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="h-10 px-3 pr-8 bg-brand-surface2 border border-brand-line focus:border-brand-accent/50 rounded-lg text-[16px] md:text-xs font-bold text-brand-text outline-none appearance-none cursor-pointer w-full xl:w-48"
          >
            <option value="">{locale === 'uz' ? "Barcha toifalar" : locale === 'ru' ? "Все категории" : "All Categories"}</option>
            {Object.entries(CATEGORIES).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
          <Icons.ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dim pointer-events-none" />
        </div>

        {/* List/Grid display layout switcher */}
        <div className="hidden md:flex bg-brand-surface2 border border-brand-line rounded-lg p-0.5 shrink-0 justify-center">
          <button 
            onClick={() => setDisplayMode("list")}
            className={`p-1.5 rounded-md transition-all ${displayMode === 'list' ? 'bg-brand-surface3 text-brand-accent' : 'text-brand-muted hover:text-brand-text'}`}
            title={getTranslation(locale, "appeals_view_list")}
          >
            <Icons.List size={15} />
          </button>
          <button 
            onClick={() => setDisplayMode("grid")}
            className={`p-1.5 rounded-md transition-all ${displayMode === 'grid' ? 'bg-brand-surface3 text-brand-accent' : 'text-brand-muted hover:text-brand-text'}`}
            title={getTranslation(locale, "appeals_view_grid")}
          >
            <Icons.LayoutGrid size={15} />
          </button>
        </div>

      </div>

      {/* Active filters removable chips */}
      {(activeStatus || activeCategory || searchQuery) && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {searchQuery && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brand-surface border border-brand-line rounded-full text-[10px] font-semibold text-brand-text">
              <span>Qidiruv: "{searchQuery}"</span>
              <button onClick={() => setSearchQuery("")} className="hover:text-red-500 transition-colors"><Icons.X size={10} /></button>
            </span>
          )}
          {activeStatus && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brand-surface border border-brand-line rounded-full text-[10px] font-semibold text-brand-text">
              <span>Holat: {getTranslation(locale, `status_${activeStatus}`)}</span>
              <button onClick={() => setActiveStatus("")} className="hover:text-red-500 transition-colors"><Icons.X size={10} /></button>
            </span>
          )}
          {activeCategory && (
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brand-surface border border-brand-line rounded-full text-[10px] font-semibold text-brand-text">
              <span>Toifa: {CATEGORIES[activeCategory]?.label || activeCategory}</span>
              <button onClick={() => setActiveCategory("")} className="hover:text-red-500 transition-colors"><Icons.X size={10} /></button>
            </span>
          )}
        </div>
      )}

      {/* Summary strip - a single 44px (h-11) strip with unread dots */}
      <div className="h-11 bg-brand-surface border border-brand-line rounded-xl px-4 flex items-center justify-between text-[11px] font-bold select-none">
        <span className="text-brand-text">
          {locale === 'uz' ? 'Jami murojaatlar' : locale === 'ru' ? 'Всего обращений' : 'Total appeals'}: {appeals.length} ta
        </span>
        <div className="flex items-center space-x-4">
          {(['new', 'reviewing', 'in_progress', 'done'] as const).map(st => (
            <span key={st} className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getStatusPillColor(st) }} />
              <span className="text-brand-muted font-mono">{appeals.filter(a => a.status === st).length}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Main Appeals Layout section */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-16 shimmer rounded-xl" />
            ))}
          </div>
        ) : appeals.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-brand-line rounded-xl bg-brand-surface space-y-4 max-w-lg mx-auto flex flex-col items-center">
            <NoAppealsIllustration />
            <p className="text-xs text-brand-muted font-bold">{getTranslation(locale, "empty_list")}</p>
          </div>
        ) : (
          <>
            {/* Desktop List View - Default on desktop (md and up) */}
            {displayMode === "list" ? (
              <div className="hidden md:flex flex-col border border-brand-line rounded-xl overflow-hidden divide-y divide-brand-line/50">
                {appeals.map((item, index) => {
                  const pillColor = getStatusPillColor(item.status);
                  const isOverdue = item.is_overdue;
                  return (
                    <div 
                      key={item.id}
                      onClick={() => handleOpenDetail(item.id)}
                      className={`h-16 px-4 flex items-center justify-between gap-4 cursor-pointer sado-list-row ${index % 2 === 0 ? 'bg-brand-surface' : 'bg-brand-surface2/30'} hover:bg-brand-surface2`}
                      style={{ borderLeft: isOverdue ? '3px solid var(--st-overdue)' : '' }}
                    >
                      {/* Left: Icon Tile + Tracking Code + Summary */}
                      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                        <CategoryIcon category={item.category} className="!w-9 !h-9 rounded-[10px] shrink-0" size={15} />
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[10px] font-extrabold text-brand-dim tracking-wider shrink-0 uppercase">{item.tracking_code}</span>
                            {isOverdue && (
                              <span className="text-[8px] font-extrabold uppercase tracking-wide text-red-500 bg-red-500/10 px-1.5 py-0.2 rounded">Muddati o'tgan</span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-brand-text truncate max-w-sm lg:max-w-md">{item.summary}</p>
                        </div>
                      </div>

                      {/* Middle Category & Mahalla details */}
                      <div className="hidden lg:block text-left text-[11px] text-brand-muted shrink-0 w-44 truncate">
                        <span>{item.category_label}</span>
                        <span className="mx-1.5 text-brand-dim">•</span>
                        <span className="font-semibold text-brand-dim">{item.location.mahalla}</span>
                      </div>

                      {/* Right Middle Status Pill */}
                      <div className="shrink-0 w-28 flex justify-start">
                        <span 
                          className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider flex items-center"
                          style={{ backgroundColor: `${pillColor}15`, color: pillColor }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: pillColor }} />
                          {item.status_label}
                        </span>
                      </div>

                      {/* Right End Cosigners Count */}
                      <div className="shrink-0 w-16 text-right flex items-center justify-end space-x-1 text-xs text-brand-dim font-bold">
                        <span>{item.cosign_count}</span>
                        <Icons.Users size={12} className="text-brand-muted" />
                      </div>

                      {/* Far Right Date indicator */}
                      <div className="shrink-0 w-20 text-right text-[10px] font-bold text-brand-dim font-mono">
                        {new Date(item.created_at).toLocaleDateString('uz-UZ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* Grid View & Mobile View Card grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${displayMode === "list" ? "md:hidden" : "grid"}`} id="appeals-cards-layout">
              {appeals.map((item) => {
                const pillColor = getStatusPillColor(item.status);
                const isOverdue = item.is_overdue;
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleOpenDetail(item.id)}
                    className="card--tinted sado-card rounded-xl p-5 cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden h-full"
                    style={{ 
                      '--tint-a': `color-mix(in srgb, ${getCategoryColor(item.category)} 10%, transparent)`,
                      borderLeft: isOverdue ? '4px solid var(--st-overdue)' : '1px solid var(--line)' 
                    } as React.CSSProperties}
                  >
                    <div className="flex items-start justify-between">
                      <CategoryIcon category={item.category} className="!w-9 !h-9 rounded-[10px]" size={15} />
                      <span 
                        className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider flex items-center"
                        style={{ backgroundColor: `${pillColor}15`, color: pillColor }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: pillColor }} />
                        {item.status_label}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="font-mono text-[10px] font-bold text-brand-dim tracking-wider uppercase block">{item.tracking_code}</span>
                      <h4 className="text-xs font-bold text-brand-text line-clamp-2 leading-snug">{item.summary}</h4>
                      <p className="text-[10px] text-brand-muted font-medium">{item.category_label} • {item.location.mahalla}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-brand-line/50 text-[10px] text-brand-dim font-bold">
                      <span className="flex items-center space-x-1 text-brand-accent">
                        <Icons.Users size={11} />
                        <span>{item.cosign_count}</span>
                      </span>
                      <span>{new Date(item.created_at).toLocaleDateString('uz-UZ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* CENTERED DETAIL MODAL - replacing right drawer (920px wide) */}
      {selectedAppeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 z-[60]" id="detail-modal-overlay" onClick={() => setSelectedAppeal(null)}>
          
          <div 
            onClick={(e) => e.stopPropagation()}
            className="card--tinted rounded-t-2xl md:rounded-2xl w-full h-[92vh] md:h-auto md:max-w-[920px] md:max-h-[88vh] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 md:fade-in md:zoom-in-95 duration-200"
            style={{ 
              '--tint-a': `color-mix(in srgb, ${getCategoryColor(selectedAppeal.category)} 12%, transparent)`
            } as React.CSSProperties}
          >
            
            {/* Mobile Drag Handle */}
            <div className="md:hidden flex justify-center py-2 shrink-0 bg-brand-surface2/30">
              <div className="w-12 h-1 bg-brand-line rounded-full opacity-60" />
            </div>

            {/* Modal Header */}
            <div className="p-4 border-b border-brand-line flex items-center justify-between bg-brand-surface2/30 select-none shrink-0">
              <div className="flex items-center space-x-2">
                {/* Close/Back button on mobile top-left */}
                <button 
                  onClick={() => setSelectedAppeal(null)}
                  className="md:hidden p-1.5 rounded-lg hover:bg-brand-surface2 text-brand-muted flex items-center justify-center mr-1"
                >
                  <Icons.ArrowLeft size={18} />
                </button>

                <span className="font-mono text-xs font-black tracking-wider text-brand-accent bg-brand-accent-glow px-2 py-0.5 rounded">
                  {selectedAppeal.tracking_code}
                </span>
                <button 
                  onClick={() => handleCopyTracking(selectedAppeal.tracking_code)}
                  className="p-1.5 hover:bg-brand-surface2 rounded-lg text-brand-muted hover:text-brand-text transition-all flex items-center space-x-1"
                  title={getTranslation(locale, "copy")}
                >
                  <Icons.Copy size={13} />
                  <span className="text-[10px] font-bold hidden sm:inline">{copiedTracking ? getTranslation(locale, "copied") : getTranslation(locale, "copy")}</span>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <span 
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center"
                  style={{ backgroundColor: `${getStatusPillColor(selectedAppeal.status)}20`, color: getStatusPillColor(selectedAppeal.status) }}
                >
                  <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: getStatusPillColor(selectedAppeal.status) }} />
                  {selectedAppeal.status_label}
                </span>

                <button 
                  onClick={() => setSelectedAppeal(null)}
                  className="hidden md:flex w-8 h-8 rounded-lg hover:bg-brand-surface2 items-center justify-center text-brand-muted hover:text-brand-text transition-colors"
                >
                  <Icons.X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable container, two columns) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column (60% equivalent = 7 cols) */}
                <div className="lg:col-span-7 space-y-5 text-left">
                  
                  {/* Complaint full text */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-dim">{getTranslation(locale, "new_appeal_form_text")}</span>
                    <p className="text-xs sm:text-sm text-brand-text leading-relaxed bg-brand-surface2 border border-brand-line p-4 rounded-xl whitespace-pre-wrap font-sans">
                      {selectedAppeal.text}
                    </p>
                  </div>

                  {/* Photo if present - click to expand */}
                  {selectedAppeal.photo_base64 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-dim">{getTranslation(locale, "new_appeal_form_photo")}</span>
                      <div 
                        onClick={() => setLightboxOpen(true)}
                        className="border border-brand-line rounded-xl overflow-hidden cursor-zoom-in max-h-[220px] aspect-video group relative"
                      >
                        <img src={selectedAppeal.photo_base64} alt="Evidence" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold space-x-1">
                          <Icons.Maximize2 size={14} />
                          <span>Kattalashtirish</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Location block */}
                  <div className="bg-brand-surface2 border border-brand-line rounded-xl p-4 space-y-2.5 text-xs">
                    <div className="flex items-center space-x-2 text-brand-accent">
                      <Icons.MapPin size={13} />
                      <span className="font-extrabold">Muammo manzili</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-brand-muted font-medium">
                      <p><span className="text-brand-dim">Viloyat:</span> {selectedAppeal.location.viloyat}</p>
                      <p><span className="text-brand-dim">Tuman:</span> {selectedAppeal.location.tuman}</p>
                      <p><span className="text-brand-dim">Mahalla:</span> {selectedAppeal.location.mahalla}</p>
                      <p><span className="text-brand-dim">Aniq manzil:</span> {selectedAppeal.location.address_detail}</p>
                    </div>
                  </div>

                </div>

                {/* Right Column (40% equivalent = 5 cols) */}
                <div className="lg:col-span-5 space-y-5 text-left">
                  
                  {/* Routed Agency Block */}
                  {selectedAppeal.agency && (
                    <div className="bg-brand-surface2 border border-brand-line rounded-xl p-4 space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-brand-accent/15 flex items-center justify-center text-brand-accent shrink-0">
                          <Icons.Shield size={18} />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-brand-accent block">{getTranslation(locale, "detail_routed_agency")}</span>
                          <h4 className="text-xs font-extrabold text-brand-text leading-snug">{selectedAppeal.agency.name}</h4>
                        </div>
                      </div>
                      
                      {selectedAppeal.agency.phone && (
                        <div className="flex items-center space-x-2 text-xs text-brand-dim">
                          <Icons.Phone size={11} className="text-brand-muted" />
                          <span className="font-mono">+{selectedAppeal.agency.phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata fields list */}
                  <div className="bg-brand-surface2/60 border border-brand-line rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-xs font-semibold py-1 border-b border-brand-line/40">
                      <span className="text-brand-dim">{getTranslation(locale, "category")}:</span>
                      <span className="text-brand-text text-right">{selectedAppeal.category_label}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold py-1 border-b border-brand-line/40">
                      <span className="text-brand-dim">{getTranslation(locale, "priority")}:</span>
                      <span className="text-brand-text capitalize">{selectedAppeal.priority || 'O\'rta'}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold py-1 border-b border-brand-line/40">
                      <span className="text-brand-dim">{getTranslation(locale, "dash_submitted")}:</span>
                      <span className="text-brand-text font-mono">{new Date(selectedAppeal.created_at).toLocaleDateString('uz-UZ')}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold py-1">
                      <span className="text-brand-dim">{getTranslation(locale, "deadline")}:</span>
                      <span className="text-brand-text font-mono text-red-500">
                        {selectedAppeal.deadline_date ? new Date(selectedAppeal.deadline_date).toLocaleDateString('uz-UZ') : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Cosigner/Support community block */}
                  <div className="bg-brand-surface2 border border-brand-line rounded-xl p-4 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1 text-brand-accent">
                        <Icons.Users size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Hamjamiyat ovozi</span>
                      </div>
                      <p className="text-xs text-brand-text font-bold">{selectedAppeal.cosign_count} kishi ushbu muammoni tasdiqladi</p>
                      {selectedAppeal.escalated_at && (
                        <p className="text-[10px] text-brand-accent font-semibold flex items-start space-x-1">
                          <span>✦</span>
                          <span>{getTranslation(locale, "detail_escalation_note")}</span>
                        </p>
                      )}
                    </div>

                    {selectedAppeal.status !== 'done' && (
                      <button
                        onClick={handleCosignToggle}
                        disabled={cosignLoading}
                        className={`w-full h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border ${selectedAppeal.has_cosigned ? 'bg-brand-surface border-brand-line text-brand-text' : 'bg-brand-accent text-white border-transparent'}`}
                      >
                        {cosignLoading ? (
                          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Icons.UserCheck size={12} />
                            <span>{selectedAppeal.has_cosigned ? "Bekor qilish" : getTranslation(locale, "join")}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Rating Block when complete */}
                  {selectedAppeal.status === 'done' && (
                    <div className="bg-brand-surface2 border border-brand-line rounded-xl p-4 space-y-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-brand-accent">{getTranslation(locale, "detail_rating_title")}</span>
                        <h4 className="text-xs font-bold text-brand-text">Ijro xizmati sifatini baholash</h4>
                      </div>

                      {selectedAppeal.rating_stars === null ? (
                        <form onSubmit={handleSubmitRating} className="space-y-3">
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }).map((_, idx) => {
                              const val = idx + 1;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setRatingStars(val)}
                                  onMouseEnter={() => setRatingHoverStars(val)}
                                  onMouseLeave={() => setRatingHoverStars(0)}
                                  className="text-xl hover:scale-110 transition-transform"
                                >
                                  <Icons.Star 
                                    size={20} 
                                    className={(ratingHoverStars || ratingStars) >= val ? "fill-brand-accent stroke-brand-accent" : "stroke-brand-dim"} 
                                  />
                                </button>
                              );
                            })}
                          </div>
                          
                          <textarea 
                            rows={2}
                            placeholder="Xizmat haqida fikringizni yozing..."
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                            className="w-full p-2.5 bg-brand-surface border border-brand-line rounded-lg text-[16px] md:text-xs text-brand-text outline-none focus:border-brand-accent/50"
                          />

                          <button
                            type="submit"
                            disabled={ratingSubmitting || ratingStars === 0}
                            className="w-full h-8 bg-brand-accent text-white hover:bg-brand-accent/90 disabled:opacity-40 text-xs font-bold rounded-lg transition-colors"
                          >
                            {getTranslation(locale, "detail_rating_submit")}
                          </button>
                        </form>
                      ) : (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <Icons.Star 
                                key={idx} 
                                size={14} 
                                className={idx < (selectedAppeal.rating_stars || 0) ? "fill-brand-accent stroke-brand-accent" : "stroke-brand-dim"} 
                              />
                            ))}
                          </div>
                          {selectedAppeal.rating_comment && (
                            <p className="text-xs text-brand-muted italic">"{selectedAppeal.rating_comment}"</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>

              </div>

              {/* Full Width Beneath Columns: Execution Timeline */}
              <div className="pt-4 border-t border-brand-line/50 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-dim block">{getTranslation(locale, "detail_timeline")}</span>
                
                {/* Responsive horizontal or neat vertical steps */}
                <div className="space-y-5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-brand-line pl-1.5">
                  {selectedAppeal.timeline?.map((step: any, idx: number) => {
                    const isLast = idx === (selectedAppeal.timeline.length - 1);
                    return (
                      <div key={idx} className="flex items-start space-x-3.5 relative">
                        <div className={`w-6 h-6 rounded-full border-2 border-brand-surface flex items-center justify-center shrink-0 z-10 ${isLast ? 'bg-brand-accent text-white ring-4 ring-brand-accent-glow/20' : 'bg-brand-surface3'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isLast ? 'bg-[#06210F]' : 'bg-brand-dim'}`} />
                        </div>
                        
                        <div className="space-y-0.5 text-left">
                          <h4 className="text-xs font-bold text-brand-text">{step.label}</h4>
                          <p className="text-[11px] text-brand-muted leading-relaxed">{step.note}</p>
                          <span className="text-[9px] text-brand-dim font-mono block">
                            {new Date(step.time).toLocaleTimeString('uz', {hour: '2-digit', minute: '2-digit'})} • {new Date(step.time).toLocaleDateString('uz')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Lightbox Expanded Image overlay */}
      {lightboxOpen && selectedAppeal?.photo_base64 && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] cursor-zoom-out"
          onClick={() => setLightboxOpen(false)}
        >
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
          >
            <Icons.X size={20} />
          </button>
          <img src={selectedAppeal.photo_base64} alt="Evidence Maximized" className="max-w-full max-h-[90vh] object-contain rounded-lg animate-in zoom-in-95 duration-150" />
        </div>
      )}

    </div>
  );
}
