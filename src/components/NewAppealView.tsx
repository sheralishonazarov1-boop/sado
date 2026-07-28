import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Region, CATEGORIES, STATUSES } from '../types';
import CategoryIcon from './CategoryIcon';
import * as Icons from 'lucide-react';
import { Locale, getTranslation } from '../i18n';
import { ReceiptBadgeIllustration } from './SadoIllustrations';

interface NewAppealViewProps {
  user: any;
  onNavigate: (view: string, params?: any) => void;
  locale: Locale;
}

export default function NewAppealView({ user, onNavigate, locale }: NewAppealViewProps) {
  // Form values
  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState("");
  const [classificationSource, setClassificationSource] = useState<'ai_accepted' | 'user_override'>('ai_accepted');
  const [aiConfidence, setAiConfidence] = useState(0);
  const [showAiBadge, setShowAiBadge] = useState(false);
  const [hasManuallySelected, setHasManuallySelected] = useState(false);

  // Cascading Geography
  const [viloyatId, setViloyatId] = useState(String(user.viloyat_id || "1"));
  const [tumanId, setTumanId] = useState(String(user.tuman_id || ""));
  const [mahallaId, setMahallaId] = useState(String(user.mahalla_id || ""));
  const [addressDetail, setAddressDetail] = useState(user.address_detail || "");

  const [viloyats, setViloyats] = useState<Region[]>([]);
  const [tumans, setTumans] = useState<Region[]>([]);
  const [mahallas, setMahallas] = useState<Region[]>([]);

  // Photo state
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Assistant states
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [originalText, setOriginalText] = useState("");
  const [draftedText, setDraftedText] = useState("");
  const [showDraftModal, setShowDraftModal] = useState(false);

  // Similar checks
  const [similarAppeals, setSimilarAppeals] = useState<any[]>([]);
  const [activeSimilarModal, setActiveSimilarModal] = useState<any | null>(null);

  // General loading & errors
  const [isClassifying, setIsClassifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Receipt view on success
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Preview receipt modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Classification debounce timer
  const typingTimeoutRef = useRef<any>(null);

  // Load regions cascading geography on mount
  useEffect(() => {
    Promise.all([
      api.get<{ items: Region[] }>("/api/regions?level=viloyat"),
      user.viloyat_id ? api.get<{ items: Region[] }>(`/api/regions?parent_id=${user.viloyat_id}`) : Promise.resolve({ items: [] }),
      user.tuman_id ? api.get<{ items: Region[] }>(`/api/regions?parent_id=${user.tuman_id}`) : Promise.resolve({ items: [] })
    ]).then(([viloyatsRes, tumansRes, mahallasRes]) => {
      setViloyats(viloyatsRes.items);
      setTumans(tumansRes.items);
      setMahallas(mahallasRes.items);
    }).catch(err => {
      console.warn("Geography loading error:", err);
    });
  }, [user]);

  // Handle geographic changes
  const handleViloyatChange = async (val: string) => {
    setViloyatId(val);
    setTumanId("");
    setMahallaId("");
    setTumans([]);
    setMahallas([]);
    try {
      const res = await api.get<{ items: Region[] }>(`/api/regions?parent_id=${val}`);
      setTumans(res.items);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleTumanChange = async (val: string) => {
    setTumanId(val);
    setMahallaId("");
    setMahallas([]);
    try {
      const res = await api.get<{ items: Region[] }>(`/api/regions?parent_id=${val}`);
      setMahallas(res.items);
    } catch (err) {
      console.warn(err);
    }
  };

  // Debounced auto-classification
  useEffect(() => {
    if (text.trim().length < 10) {
      setShowAiBadge(false);
      setSimilarAppeals([]);
      return;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsClassifying(true);
      
      // Post for automatic classification
      api.post<any>("/api/ai/classify", { text })
        .then(res => {
          setAiSuggestedCategory(res.category);
          setAiConfidence(Math.round(res.confidence * 100));
          setShowAiBadge(true);
          setIsClassifying(false);
          
          if (!hasManuallySelected) {
            setCategory(res.category);
            setClassificationSource('ai_accepted');
          }

          // Trigger duplicates check in parallel
          api.get<{ items: any[] }>(`/api/appeals/similar?category=${res.category}&mahalla_id=${mahallaId}&text=${encodeURIComponent(text)}`)
            .then(simRes => {
              setSimilarAppeals(simRes.items || []);
            })
            .catch(() => {});
        })
        .catch(err => {
          console.warn("AI classification error:", err);
          setIsClassifying(false);
        });
    }, 400); // 400ms debounce as requested

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [text, mahallaId, hasManuallySelected]);

  // AI draft refiner
  const handleDraftRewrite = async () => {
    if (text.trim().length < 5) {
      setError("Iltimos, tahrirlash uchun matn kiriting (kamida 5 ta belgi).");
      return;
    }
    setError(null);
    setAssistantLoading(true);
    try {
      const res = await api.post<{ draft_text: string }>("/api/ai/draft", { rough_text: text });
      setOriginalText(text);
      setDraftedText(res.draft_text);
      setShowDraftModal(true);
    } catch (err: any) {
      setError("Model is highly demanded. Local fallback utilized.");
      // Simple capitalization fallback
      setOriginalText(text);
      setDraftedText(text.charAt(0).toUpperCase() + text.slice(1));
      setShowDraftModal(true);
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleAcceptDraft = () => {
    setText(draftedText);
    setShowDraftModal(false);
  };

  // Drag & drop file loaders
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setPhotoBase64(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCategory(val);
    setHasManuallySelected(true);
    setClassificationSource('user_override');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (text.trim().length < 10) {
      setError("Murojaat matni kamida 10 ta belgidan iborat bo'lishi lozim.");
      return;
    }
    if (!category) {
      setError("Iltimos, murojaat toifasini tanlang.");
      return;
    }
    if (!viloyatId || !tumanId || !mahallaId) {
      setError("Muammo sodir bo'lgan to'liq hududni kiriting.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<any>("/api/appeals", {
        text: text.trim(),
        category,
        ai_suggested_category: aiSuggestedCategory,
        viloyat_id: Number(viloyatId),
        tuman_id: Number(tumanId),
        mahalla_id: Number(mahallaId),
        address_detail: addressDetail.trim(),
        photo_base64: photoBase64
      });

      setSuccessReceipt(res);
      setShowPreviewModal(false);
    } catch (err: any) {
      setError(err.detail || "Murojaatni jo'natishda xatolik yuz berdi.");
    } finally {
      setLoading(false);
    }
  };

  // Join existing duplicate
  const handleJoinDuplicate = async (id: number) => {
    setLoading(true);
    try {
      await api.post(`/api/appeals/${id}/cosign`);
      setActiveSimilarModal(null);
      onNavigate("appeals", { activeAppealId: id });
    } catch (err) {
      console.error(err);
      setError("Ovozlarga qo'shilishda xatolik yuz berdi.");
      setLoading(false);
    }
  };

  // Calculated deadline (7 days out)
  const calculatedDeadline = new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString('uz-UZ');

  const getAgencyLabel = (cat: string) => {
    if (!cat) return "Idora aniqlanmoqda";
    if (cat === 'other') return "Tuman Hokimligi";
    if (cat === 'roads') return "Yo'l qurilish boshqarmasi";
    if (cat === 'healthcare') return "Sog'liqni saqlash boshqarmasi";
    if (cat === 'preschool_education') return "Maktabgacha ta'lim vazirligi";
    if (cat === 'public_order') return "Ichki ishlar boshqarmasi";
    return "Hududiy Kommunal xizmat";
  };

  // Success Receipt view
  if (successReceipt) {
    const handleCopyReceipt = () => {
      const summaryText = `SADO MUROJAAT KVITANSIYASI\n\n` +
        `Kuzatuv kodi: ${successReceipt.tracking_code}\n` +
        `Yuborilgan sana: ${new Date().toLocaleDateString('uz-UZ')}\n` +
        `Idora: ${getAgencyLabel(successReceipt.category)}\n` +
        `Muddat: ${calculatedDeadline}\n` +
        `Mahalla: ${user.mahalla_id ? "Al-Xorazmiy" : "Markaziy"} MFY`;
      navigator.clipboard.writeText(summaryText);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2000);
    };

    return (
      <div className="w-full max-w-md mx-auto px-4 py-8 md:py-12 space-y-6 sado-page-transition" id="receipt-ticket">
        
        {/* Perforated ticket layout wrapper */}
        <div className="bg-brand-surface border border-brand-line rounded-2xl shadow-xl relative overflow-hidden flex flex-col">
          <div className="bg-brand-accent h-1.5 w-full" />
          
          <div className="p-6 md:p-8 space-y-5 text-center">
            <ReceiptBadgeIllustration className="mx-auto w-16 h-16 text-brand-accent animate-[bounce_2s_infinite]" />
            
            <div className="space-y-1">
              <h2 className="text-[19px] font-black text-brand-text font-display leading-tight">Murojaat qabul qilindi!</h2>
              <p className="text-xs text-brand-dim font-medium">Ushbu elektron kvitansiyani saqlab qo'ying</p>
            </div>

            <div className="bg-brand-surface2 border border-brand-line p-4 rounded-xl font-mono text-center space-y-1">
              <span className="text-[9px] uppercase font-bold text-brand-dim tracking-wider">KUZATUV KODI</span>
              <p className="text-xl font-black text-brand-text tracking-widest">{successReceipt.tracking_code}</p>
            </div>

            <button 
              onClick={handleCopyReceipt}
              className="text-xs font-bold text-brand-accent flex items-center justify-center space-x-1.5 hover:underline mx-auto px-3 py-1.5 bg-brand-accent-glow/5 hover:bg-brand-accent-glow/10 rounded-lg transition-all"
            >
              {copiedReceipt ? (
                <>
                  <Icons.CheckCircle size={13} className="text-brand-accent" />
                  <span>Kvitansiya nusxalandi!</span>
                </>
              ) : (
                <>
                  <Icons.Copy size={13} />
                  <span>Kvitansiyadan nusxa olish</span>
                </>
              )}
            </button>
          </div>

          {/* Perforation Line Effect */}
          <div className="relative flex items-center justify-between px-1 h-4 bg-brand-surface select-none">
            {/* Left punch-out hole */}
            <div className="w-4 h-4 bg-brand-bg border-r border-brand-line rounded-full -ml-3 z-10" />
            {/* Dashed perforation track */}
            <div className="flex-1 border-t-2 border-dashed border-brand-line/60 mx-1" />
            {/* Right punch-out hole */}
            <div className="w-4 h-4 bg-brand-bg border-l border-brand-line rounded-full -mr-3 z-10" />
          </div>

          {/* Ticket Bottom section */}
          <div className="p-6 md:p-8 bg-brand-surface2/40 border-t border-brand-line/40 text-left space-y-3.5 text-xs text-brand-muted">
            <div className="flex justify-between font-semibold">
              <span className="text-brand-dim">Yo'naltirilgan idora:</span>
              <span className="font-bold text-brand-text text-right">{getAgencyLabel(successReceipt.category)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-brand-dim">Nazorat muddati:</span>
              <span className="font-bold text-red-500 font-mono">{calculatedDeadline}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-brand-dim">Ariza beruvchi hududi:</span>
              <span className="font-bold text-brand-text">{user.mahalla_id ? "Al-Xorazmiy" : "Markaziy"} MFY</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={() => onNavigate("appeals", { activeAppealId: successReceipt.id })}
            className="flex-1 h-12 bg-brand-accent text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center space-x-1.5 sado-btn sado-btn-primary"
          >
            <Icons.Eye size={14} />
            <span>Murojaatni kuzatish</span>
          </button>
          <button 
            onClick={() => onNavigate("dashboard")}
            className="flex-1 h-12 bg-brand-surface border border-brand-line text-brand-text hover:bg-brand-surface2 font-bold rounded-xl transition-all text-xs sado-btn"
          >
            <span>Bosh sahifaga qaytish</span>
          </button>
        </div>

      </div>
    );
  }

  const selectedCat = CATEGORIES[category];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-6 py-6 space-y-6" id="new-appeal-v2">
      
      {/* Header title */}
      <div className="space-y-1 pb-4 border-b border-brand-line/50">
        <h2 className="text-[26px] font-bold text-brand-text font-display leading-tight">{getTranslation(locale, "new_appeal_title")}</h2>
        <p className="text-xs text-brand-muted font-medium">{getTranslation(locale, "new_appeal_desc")}</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold flex items-center space-x-2">
          <Icons.AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: 2 columns inside (Left 60%, Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols): Main Appeal form */}
        <div className="lg:col-span-7 space-y-5">
          
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 1. Description Textarea */}
            <div className="bg-brand-surface border border-brand-line rounded-xl p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-text">
                  1. {getTranslation(locale, "new_appeal_form_text")}
                </label>
                <span className="text-[10px] text-brand-dim font-bold font-mono">{text.length} ta belgi (min 10)</span>
              </div>

              <textarea 
                rows={5}
                placeholder={getTranslation(locale, "new_appeal_form_text_placeholder")}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full p-4 bg-brand-surface2 border border-brand-line focus:border-brand-accent/50 rounded-lg text-[16px] md:text-xs leading-relaxed text-brand-text outline-none transition-colors"
                required
              />

              {/* AI text refinement trigger */}
              <div className="flex items-center justify-between pt-2 border-t border-brand-line/50">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-brand-accent uppercase tracking-wider block">AI Tahrirchi</span>
                  <span className="text-[10px] text-brand-muted block">Murojaat matnini qonuniy uslubda yozish taklifi</span>
                </div>
                <button 
                  type="button"
                  onClick={handleDraftRewrite}
                  disabled={assistantLoading || text.trim().length < 5}
                  className="px-3.5 py-1.5 bg-brand-accent-glow hover:bg-brand-accent/20 text-brand-accent text-[11px] font-bold rounded-lg transition-all flex items-center space-x-1.5"
                >
                  {assistantLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Icons.Sparkles size={11} />
                      <span>{getTranslation(locale, "new_appeal_drafting")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Drag and drop photo upload */}
            <div className="bg-brand-surface border border-brand-line rounded-xl p-5 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-text block">
                2. {getTranslation(locale, "new_appeal_form_photo")}
              </label>

              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center space-y-2 transition-all ${dragActive ? 'border-brand-accent bg-brand-accent-glow/5' : 'border-brand-line bg-brand-surface2'}`}
              >
                {photoBase64 ? (
                  <div className="relative w-24 h-24 rounded-lg border border-brand-line overflow-hidden group">
                    <img src={photoBase64} alt="Evidence" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => setPhotoBase64(null)}
                      className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-red-400 hover:text-red-500 hover:bg-black/80 transition-colors"
                    >
                      <Icons.X size={11} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-brand-accent-glow flex items-center justify-center text-brand-accent">
                      <Icons.UploadCloud size={20} />
                    </div>
                    <div className="text-xs text-brand-text font-bold">
                      {getTranslation(locale, "new_appeal_form_photo_desc")}
                    </div>
                    <p className="text-[10px] text-brand-dim">PNG, JPG formatlar, maks 400KB</p>
                    <label className="px-3 py-1 bg-brand-surface border border-brand-line rounded-md text-[10px] font-bold text-brand-muted cursor-pointer hover:border-brand-accent transition-colors">
                      Tanlash
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* 3. Address Text Field with Cascading selectors */}
            <div className="bg-brand-surface border border-brand-line rounded-xl p-5 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-text block">
                3. {getTranslation(locale, "new_appeal_form_location")}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select 
                  value={viloyatId}
                  onChange={(e) => handleViloyatChange(e.target.value)}
                  className="h-10 px-3 bg-brand-surface2 border border-brand-line rounded-lg text-[16px] md:text-xs font-semibold text-brand-text outline-none"
                >
                  {viloyats.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>

                <select 
                  value={tumanId}
                  onChange={(e) => handleTumanChange(e.target.value)}
                  className="h-10 px-3 bg-brand-surface2 border border-brand-line rounded-lg text-[16px] md:text-xs font-semibold text-brand-text outline-none"
                  required
                >
                  <option value="">Tuman</option>
                  {tumans.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <select 
                  value={mahallaId}
                  onChange={(e) => setMahallaId(e.target.value)}
                  className="h-10 px-3 bg-brand-surface2 border border-brand-line rounded-lg text-[16px] md:text-xs font-semibold text-brand-text outline-none"
                  required
                >
                  <option value="">Mahalla</option>
                  {mahallas.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <input 
                type="text"
                placeholder={getTranslation(locale, "new_appeal_form_loc_placeholder")}
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                className="w-full h-10 px-3 bg-brand-surface2 border border-brand-line rounded-lg text-[16px] md:text-xs font-semibold text-brand-text outline-none focus:border-brand-accent/50"
                required
              />
            </div>

            {/* Manual override selection */}
            <div className="bg-brand-surface border border-brand-line rounded-xl p-5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-text block">Toifani o'zgartirish (ixtiyoriy)</label>
                {showAiBadge && (
                  <span className="text-[9px] bg-brand-ai-glow border border-brand-ai/30 text-[#A78BFA] font-bold px-1.5 py-0.5 rounded">AI tavsiyasi</span>
                )}
              </div>
              <select 
                value={category}
                onChange={handleCategoryChange}
                className="w-full h-10 px-3 bg-brand-surface2 border border-brand-line rounded-lg text-[16px] md:text-xs font-semibold text-brand-text outline-none"
                required
              >
                <option value="">{getTranslation(locale, "new_appeal_form_cat")}</option>
                {Object.entries(CATEGORIES).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3 pt-2">
              <button 
                type="button"
                onClick={() => setShowPreviewModal(true)}
                disabled={text.trim().length < 10 || !category}
                className="flex-1 h-11 bg-brand-surface border border-brand-line hover:bg-brand-surface2 text-brand-text font-bold rounded-xl text-xs transition-colors"
              >
                {getTranslation(locale, "new_appeal_preview")}
              </button>

              <button 
                type="submit"
                disabled={loading || isClassifying || text.trim().length < 10 || !category}
                className="flex-1 h-11 bg-brand-accent text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-lg shadow-brand-accent/10"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Icons.Send size={13} />
                    <span>{getTranslation(locale, "new_appeal_submit")}</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

        {/* Right Column (5 cols): Sticky Real-time AI Analysis panel */}
        <div className="lg:col-span-5 sticky top-24 space-y-5" id="sticky-ai-analysis-panel">
          
          <div className="bg-brand-surface border border-brand-line rounded-xl p-5 space-y-4">
            
            <div className="flex items-center space-x-2 pb-2.5 border-b border-brand-line/50">
              <Icons.Sparkles className="text-[#A78BFA]" size={16} />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-text">
                {getTranslation(locale, "new_appeal_ai_panel")}
              </h3>
            </div>

            {/* If fields are empty: typing indicator asking for more info */}
            {text.trim().length < 10 ? (
              <div className="py-12 text-center space-y-3">
                <div className="flex justify-center space-x-1">
                  <span className="w-2.5 h-2.5 bg-brand-accent rounded-full animate-bounce duration-300 delay-75" />
                  <span className="w-2.5 h-2.5 bg-brand-accent rounded-full animate-bounce duration-300 delay-150" />
                  <span className="w-2.5 h-2.5 bg-brand-accent rounded-full animate-bounce duration-300 delay-225" />
                </div>
                <p className="text-[11px] text-brand-muted leading-relaxed max-w-xs mx-auto">
                  {getTranslation(locale, "new_appeal_ai_placeholder")}
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-left">
                
                {/* 1. Shimmer/AI analysis details */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-brand-dim tracking-wider">TAHLIL</span>
                  {isClassifying ? (
                    <div className="h-10 bg-brand-surface2 rounded-lg animate-pulse" />
                  ) : (
                    <p className="text-xs text-brand-text leading-relaxed bg-brand-surface2 border border-brand-line/40 p-3 rounded-lg font-medium">
                      ✦ Murojaat matni tahlil qilindi. Mazmuni {selectedCat?.label || 'Boshqa'} masalasiga taalluqli deb aniqlandi. (Ishonch: {aiConfidence}%)
                    </p>
                  )}
                </div>

                {/* 2. Assigned organization */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-brand-dim tracking-wider">TASHKILOT</span>
                  <div className="bg-brand-surface2 border border-brand-line p-3 rounded-lg flex items-center space-x-3.5">
                    <div className="w-8 h-8 rounded bg-brand-accent-glow flex items-center justify-center text-brand-accent shrink-0">
                      <Icons.Shield size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-brand-text leading-tight">{getAgencyLabel(category)}</h4>
                      <span className="text-[9px] text-brand-accent font-semibold block">Avtomatik yo'naltirildi</span>
                    </div>
                  </div>
                </div>

                {/* 3. Selected Category */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-brand-dim tracking-wider">TOIFA</span>
                  <div className="bg-brand-surface2 border border-brand-line p-3 rounded-lg flex items-center space-x-3">
                    <CategoryIcon category={category} className="!w-8 !h-8 rounded-lg shrink-0" size={13} />
                    <span className="text-xs font-bold text-brand-text">{selectedCat?.label || 'Boshqa'}</span>
                  </div>
                </div>

                {/* 4. Calculated deadline */}
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-brand-dim tracking-wider">MUDDATI</span>
                  <div className="bg-brand-surface2 border border-brand-line p-3 rounded-lg flex items-center justify-between text-xs font-bold text-brand-text">
                    <span>Muddati (7 kun)</span>
                    <span className="text-red-500 font-mono">{calculatedDeadline}</span>
                  </div>
                </div>

                {/* 5. Similar appeals duplicate check list */}
                <div className="space-y-2 pt-2 border-t border-brand-line/50">
                  <span className="text-[9px] uppercase font-bold text-brand-dim tracking-wider block">
                    {getTranslation(locale, "new_appeal_similar")} ({similarAppeals.length})
                  </span>
                  {similarAppeals.length === 0 ? (
                    <p className="text-[10px] text-brand-dim">Mahallangizda ushbu toifada bir xil muammoli arizalar topilmadi.</p>
                  ) : (
                    <div className="space-y-2">
                      {similarAppeals.slice(0, 3).map((sim) => (
                        <div 
                          key={sim.id}
                          onClick={() => setActiveSimilarModal(sim)}
                          className="bg-brand-surface2 hover:bg-brand-surface3 border border-brand-line p-2.5 rounded-lg text-left cursor-pointer transition-colors space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px] font-bold text-brand-dim uppercase">{sim.tracking_code}</span>
                            <span className="text-[9px] text-brand-accent font-bold flex items-center space-x-0.5">
                              <Icons.Users size={10} />
                              <span>{sim.cosign_count}</span>
                            </span>
                          </div>
                          <p className="text-xs text-brand-text font-bold line-clamp-1 leading-snug">{sim.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* MODAL 1: Similar appeal full detail preview with co-signing option */}
      {activeSimilarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[70]">
          <div className="bg-brand-surface border border-brand-line rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-brand-line">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-accent">
                {activeSimilarModal.tracking_code}
              </h3>
              <button onClick={() => setActiveSimilarModal(null)} className="text-brand-muted hover:text-brand-text">
                <Icons.X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-dim">Murojaat tafsiloti</div>
              <p className="text-xs text-brand-text bg-brand-surface2 border border-brand-line p-3 rounded-lg leading-relaxed max-h-40 overflow-y-auto">
                {activeSimilarModal.text}
              </p>
              <div className="text-[10px] font-bold uppercase tracking-wider text-brand-dim">Joylashuv</div>
              <p className="text-xs text-brand-muted">{activeSimilarModal.location.address_detail}</p>
            </div>

            <div className="bg-brand-surface2 border border-brand-line p-3 rounded-lg flex items-center justify-between text-xs font-bold text-brand-text">
              <span>Hozirgi qo'llab-quvvatlash:</span>
              <span className="text-brand-accent">{activeSimilarModal.cosign_count} kishi</span>
            </div>

            <div className="flex space-x-3 pt-2">
              <button 
                onClick={() => handleJoinDuplicate(activeSimilarModal.id)}
                disabled={loading}
                className="flex-1 h-10 bg-brand-accent text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Icons.UserCheck size={13} />
                    <span>Qo'shilish</span>
                  </>
                )}
              </button>
              <button 
                onClick={() => setActiveSimilarModal(null)}
                className="flex-1 h-10 bg-brand-surface2 hover:bg-brand-surface3 border border-brand-line text-brand-text font-bold rounded-lg text-xs"
              >
                Ortga qaytish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Receipt Preview on demand */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-[70]">
          <div className="bg-brand-surface border border-brand-line rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <Icons.Sparkles className="mx-auto text-brand-accent mb-1 animate-pulse" size={24} />
              <h3 className="text-xs font-black uppercase tracking-wider text-brand-text">Murojaat kvitansiyasi</h3>
              <p className="text-[11px] text-brand-dim font-medium">Yuborilishdan oldingi tahlil tasviri</p>
            </div>

            <div className="border-t border-b border-brand-line/60 py-3 text-left space-y-2.5 text-xs text-brand-muted">
              <div className="flex justify-between">
                <span>Toifa:</span>
                <span className="font-bold text-brand-text">{selectedCat?.label || "Boshqa"}</span>
              </div>
              <div className="flex justify-between">
                <span>Mas'ul tashkilot:</span>
                <span className="font-bold text-brand-text">{getAgencyLabel(category)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ijro muddati:</span>
                <span className="font-bold text-red-500 font-mono">{calculatedDeadline}</span>
              </div>
              <div className="flex justify-between">
                <span>Hudud:</span>
                <span className="font-bold text-brand-text">{user.mahalla_id ? "Al-Xorazmiy" : "Markaziy"} MFY</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-1">
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 h-10 bg-brand-accent text-white font-bold rounded-lg text-xs"
              >
                {loading ? "Yuborilmoqda..." : "Yuborishni tasdiqlash"}
              </button>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 h-10 bg-brand-surface2 hover:bg-brand-surface3 border border-brand-line text-brand-text font-bold rounded-lg text-xs"
              >
                Tahrirlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Draft proposal edit Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-brand-surface border border-brand-line rounded-2xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center space-x-2">
              <Icons.Sparkles className="text-[#A78BFA]" size={16} />
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-brand-text font-display">AI Tahrirlash Taklifi</h3>
            </div>

            <p className="text-xs text-brand-muted font-medium">Murojaatingiz rasmiy, qonuniy va tahliliy tilda qayta tahrirlandi:</p>

            <div className="grid grid-cols-1 gap-4 text-left">
              <div className="bg-brand-surface2 border border-brand-line p-3 rounded-lg space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-dim">Siz yozgan matn:</span>
                <p className="text-xs text-brand-muted line-clamp-3">{originalText}</p>
              </div>

              <div className="border border-[#A78BFA]/30 bg-[#A78BFA]/5 p-3 rounded-lg space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#A78BFA]">AI taklifi:</span>
                <p className="text-xs text-[#A78BFA] leading-relaxed">{draftedText}</p>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={handleAcceptDraft}
                className="w-full h-10 bg-[#A78BFA] hover:bg-[#A78BFA]/90 text-brand-bg font-bold rounded-lg text-xs"
              >
                Qabul qilish
              </button>
              
              <button
                type="button"
                onClick={() => setShowDraftModal(false)}
                className="w-full h-10 border border-brand-line hover:bg-brand-surface2 text-brand-text font-semibold rounded-lg text-xs"
              >
                Bekor qilish
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
