import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { adminApi } from '../../api';

interface AdminAppealsQueueProps {
  user: any;
  adminToken: string;
  initialDetailId?: number | null;
  onClearParams?: () => void;
}

export default function AdminAppealsQueueView({
  user,
  adminToken,
  initialDetailId,
  onClearParams
}: AdminAppealsQueueProps) {
  // Query state
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [agencyFilter, setAgencyFilter] = useState("");
  const [assignFilter, setAssignFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("newest");

  // Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Active Appeal Detail
  const [selectedAppeal, setSelectedAppeal] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form states for Detail interaction
  const [statusNote, setStatusNote] = useState("");
  const [internalNoteText, setInternalNoteText] = useState("");
  const [isInternalToggle, setIsInternalToggle] = useState(true);
  const [assignStaffId, setAssignStaffId] = useState("");
  const [reassignAgencyId, setReassignAgencyId] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  // Lists for dropdowns
  const [agenciesList, setAgenciesList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Modals / Dropdowns
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("in_progress");
  const [bulkNote, setBulkNote] = useState("");
  const [showReassignModal, setShowReassignModal] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const triggerToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch lists
  const fetchAuxiliaryLists = async () => {
    try {
      const agencyData = await adminApi.get<any>("/api/public/agencies");
      setAgenciesList(agencyData.items || []);

      const staffData = await adminApi.get<any>("/api/admin/users");
      setStaffList(staffData.items || []);
    } catch (err) {
      console.error("Auxiliary lists loading failed:", err);
    }
  };

  // Fetch appeals queue
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/appeals", window.location.origin);
      if (statusFilter) url.searchParams.append("status", statusFilter);
      if (priorityFilter) url.searchParams.append("priority", priorityFilter);
      if (agencyFilter) url.searchParams.append("agency_id", agencyFilter);
      if (assignFilter) url.searchParams.append("assigned_to", assignFilter);
      if (searchTerm) url.searchParams.append("q", searchTerm);
      if (sortField) url.searchParams.append("sort", sortField);

      const data = await adminApi.get<any>(`${url.pathname}${url.search}`);
      setAppeals(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Queue load failure:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Single Appeal Detail
  const fetchDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const data = await adminApi.get<any>(`/api/admin/appeals/${id}`);
      setSelectedAppeal(data.appeal);
      setTimeline(data.timeline || []);
    } catch (err: any) {
      triggerToast('error', err.detail || err.message || "Tafsilotlarni yuklab bo'lmadi.");
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchAuxiliaryLists();
  }, [adminToken]);

  useEffect(() => {
    fetchQueue();
  }, [statusFilter, priorityFilter, agencyFilter, assignFilter, searchTerm, sortField]);

  useEffect(() => {
    if (initialDetailId) {
      fetchDetail(initialDetailId);
      if (onClearParams) onClearParams();
    }
  }, [initialDetailId]);

  // Bulk Status Update
  const handleBulkStatusChange = async () => {
    if (selectedIds.length === 0) return;
    try {
      const data = await adminApi.post<any>("/api/admin/appeals/bulk-status", {
        ids: selectedIds,
        status: bulkStatus,
        note: bulkNote
      });

      triggerToast('success', `${data.updated} ta murojaat muvaffaqiyatli yangilandi.`);
      setSelectedIds([]);
      setShowBulkModal(false);
      setBulkNote("");
      fetchQueue();
    } catch (err: any) {
      triggerToast('error', err.detail || err.message);
    }
  };

  // Single Action: Status Change
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedAppeal) return;
    try {
      await adminApi.patch<any>(`/api/admin/appeals/${selectedAppeal.id}/status`, {
        status: newStatus,
        note: statusNote || "Holat o'zgartirildi"
      });

      triggerToast('success', "Holat muvaffaqiyatli o'zgartirildi.");
      setStatusNote("");
      fetchDetail(selectedAppeal.id);
      fetchQueue();
    } catch (err: any) {
      triggerToast('error', err.detail || err.message);
    }
  };

  // Single Action: Assign Staff
  const handleAssignStaff = async () => {
    if (!selectedAppeal || !assignStaffId) return;
    try {
      await adminApi.patch<any>(`/api/admin/appeals/${selectedAppeal.id}/assign`, { user_id: assignStaffId });

      triggerToast('success', "Mas'ul muvaffaqiyatli biriktirildi.");
      setAssignStaffId("");
      fetchDetail(selectedAppeal.id);
      fetchQueue();
    } catch (err: any) {
      triggerToast('error', err.detail || err.message);
    }
  };

  // Single Action: Add Internal Note / Comment
  const handleAddNote = async () => {
    if (!selectedAppeal || !internalNoteText.trim()) return;
    try {
      await adminApi.post<any>(`/api/admin/appeals/${selectedAppeal.id}/note`, {
        text: internalNoteText,
        is_internal: isInternalToggle
      });

      triggerToast('success', isInternalToggle ? "Ichki eslatma qo'shildi." : "Izoh muvaffaqiyatli qo'shildi.");
      setInternalNoteText("");
      fetchDetail(selectedAppeal.id);
      fetchQueue();
    } catch (err: any) {
      triggerToast('error', err.detail || err.message);
    }
  };

  // Single Action: Reassign to other agency
  const handleReassignAgency = async () => {
    if (!selectedAppeal || !reassignAgencyId || !reassignReason.trim()) {
      triggerToast('error', "Iltimos, qayta yo'naltirilayotgan idora va sababini kiriting.");
      return;
    }
    try {
      await adminApi.post<any>(`/api/admin/appeals/${selectedAppeal.id}/reassign`, {
        target_agency_id: Number(reassignAgencyId),
        reason: reassignReason
      });

      triggerToast('success', "Murojaat boshqa idoraga muvaffaqiyatli yo'naltiriladi.");
      setReassignAgencyId("");
      setReassignReason("");
      setShowReassignModal(false);
      setSelectedAppeal(null); // Close detail since it moved out of current scope (if caseworker)
      fetchQueue();
    } catch (err: any) {
      triggerToast('error', err.detail || err.message);
    }
  };

  // Selection helpers
  const handleSelectRow = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === appeals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(appeals.map(a => a.id));
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'new': return 'bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/20';
      case 'reviewing': return 'bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20';
      case 'in_progress': return 'bg-[#A78BFA]/10 text-[#A78BFA] border border-[#A78BFA]/20';
      case 'done': return 'bg-[#3DDC84]/10 text-[#3DDC84] border border-[#3DDC84]/20';
      default: return 'bg-brand-dim/10 text-brand-muted';
    }
  };

  const getPriorityStyle = (prio: string) => {
    switch (prio) {
      case 'high': return 'text-[#F87171] bg-[#F87171]/10 px-2 py-0.5 rounded font-bold text-[10px] uppercase';
      case 'medium': return 'text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-bold text-[10px] uppercase';
      case 'low': return 'text-[#3DDC84] bg-[#3DDC84]/10 px-2 py-0.5 rounded font-bold text-[10px] uppercase';
      default: return 'text-brand-dim bg-brand-surface2 px-2 py-0.5 rounded font-bold text-[10px]';
    }
  };

  return (
    <div className="flex h-full min-h-[500px] gap-4 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 animate-fadeIn border ${
          toast.type === 'success' ? 'bg-[#3DDC84]/10 border-[#3DDC84]/30 text-[#3DDC84]' : 'bg-[#F87171]/10 border-[#F87171]/30 text-[#F87171]'
        }`}>
          {toast.type === 'success' ? <Icons.CheckCircle size={16} /> : <Icons.AlertCircle size={16} />}
          <span className="text-xs font-bold">{toast.text}</span>
        </div>
      )}

      {/* LEFT SIDE: QUEUE CONTAINER */}
      <div className="flex-1 bg-brand-surface border border-brand-line rounded-xl flex flex-col overflow-hidden">
        {/* Sub-header Filter controls */}
        <div className="p-3.5 border-b border-brand-line/60 bg-brand-surface flex flex-wrap items-center justify-between gap-3.5 select-none">
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs font-semibold text-brand-text focus:outline-none focus:border-brand-accent"
            >
              <option value="">Barcha holatlar</option>
              <option value="new">Yangi</option>
              <option value="reviewing">Ko'rib chiqilmoqda</option>
              <option value="in_progress">Ijroda</option>
              <option value="done">Yakunlangan</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs font-semibold text-brand-text focus:outline-none focus:border-brand-accent"
            >
              <option value="">Barcha muhimliklar</option>
              <option value="high">Yuqori</option>
              <option value="medium">O'rta</option>
              <option value="low">Past</option>
            </select>

            {/* Scope Agency Filter for Super admin only */}
            {user.role === 'super_admin' && (
              <select
                value={agencyFilter}
                onChange={(e) => setAgencyFilter(e.target.value)}
                className="h-9 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs font-semibold text-brand-text focus:outline-none focus:border-brand-accent"
              >
                <option value="">Barcha idoralar</option>
                {agenciesList.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            )}

            {/* Assignment Filter */}
            <select
              value={assignFilter}
              onChange={(e) => setAssignFilter(e.target.value)}
              className="h-9 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs font-semibold text-brand-text focus:outline-none focus:border-brand-accent"
            >
              <option value="">Barcha biriktiruvlar</option>
              <option value="unassigned">Mas'ul tayinlanmagan</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="relative w-full max-w-[240px]">
            <Icons.Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dim" />
            <input
              type="text"
              placeholder="Qidiruv (Kodi, mazmuni)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-brand-surface2 border border-brand-line text-xs text-brand-text placeholder-brand-dim focus:outline-none focus:border-brand-accent font-medium"
            />
          </div>
        </div>

        {/* Bulk Action Bar (Visible when rows selected) */}
        {selectedIds.length > 0 && (
          <div className="bg-brand-accent/10 border-b border-brand-line p-3 px-4 flex items-center justify-between select-none animate-fadeIn">
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-bold text-brand-accent">{selectedIds.length} ta murojaat tanlandi</span>
            </div>
            <button
              onClick={() => {
                setBulkStatus("in_progress");
                setShowBulkModal(true);
              }}
              className="h-8 px-3 bg-brand-accent hover:bg-brand-accent/90 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <Icons.Grid size={12} />
              <span>Guruhli holat o'zgartirish</span>
            </button>
          </div>
        )}

        {/* APPEALS LIST TABLE */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 py-16">
              <Icons.Loader className="animate-spin text-brand-accent" size={24} />
              <span className="text-xs text-brand-muted font-bold">Murojaatlar ro'yxati yuklanmoqda...</span>
            </div>
          ) : appeals.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-24 text-center select-none">
              <Icons.Inbox size={48} className="text-brand-dim mb-3 animate-bounce" />
              <p className="text-xs font-bold text-brand-muted">Kiritilgan mezonlar bo'yicha murojaat topilmadi</p>
              <p className="text-[11px] text-brand-dim mt-1">Sassiya filtrlarini tozalab qaytadan ko'ring</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-line/60 text-[11px] text-brand-dim font-bold uppercase select-none bg-brand-surface2/30 sticky top-0 h-10">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === appeals.length}
                      onChange={handleSelectAll}
                      className="rounded border-brand-line bg-brand-surface2 text-brand-accent focus:ring-0 focus:outline-none w-3.5 h-3.5 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 w-28">Kodi</th>
                  <th className="p-3">Qisqacha mazmuni</th>
                  <th className="p-3 w-32">Kategoriya</th>
                  <th className="p-3 w-24">Muhimlik</th>
                  <th className="p-3 w-32">Holat</th>
                  <th className="p-3 w-36">Mas'ul</th>
                  <th className="p-3 w-20 text-center">Tafsilot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line/40 text-xs font-medium">
                {appeals.map((appeal) => {
                  const isSelected = selectedIds.includes(appeal.id);
                  const isViewing = selectedAppeal?.id === appeal.id;
                  return (
                    <tr
                      key={appeal.id}
                      className={`hover:bg-brand-surface2/30 transition-colors h-[52px] group ${
                        isSelected ? 'bg-brand-accent/5' : ''
                      } ${isViewing ? 'bg-brand-surface2' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(appeal.id)}
                          className="rounded border-brand-line bg-brand-surface2 text-brand-accent focus:ring-0 focus:outline-none w-3.5 h-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 font-mono font-semibold text-brand-accent tracking-wide uppercase select-all">
                        {appeal.tracking_code}
                      </td>
                      <td className="p-3 min-w-[200px] max-w-[340px]">
                        <p className="text-brand-text font-bold truncate">{appeal.summary}</p>
                        <p className="text-[10px] text-brand-dim truncate mt-0.5">{appeal.text}</p>
                      </td>
                      <td className="p-3 text-brand-muted truncate max-w-[120px]" title={appeal.category_label}>
                        {appeal.category_label}
                      </td>
                      <td className="p-3">
                        <span className={getPriorityStyle(appeal.priority)}>
                          {appeal.priority_label}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(appeal.status)}`}>
                          {appeal.status_label}
                        </span>
                      </td>
                      <td className="p-3 text-brand-muted truncate max-w-[140px]">
                        {appeal.assigned_to ? (
                          <div className="flex items-center space-x-1.5">
                            <Icons.User size={12} className="text-brand-dim" />
                            <span className="truncate">{appeal.assigned_to.full_name}</span>
                          </div>
                        ) : (
                          <span className="text-brand-dim">Tayinlanmagan</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => fetchDetail(appeal.id)}
                          className="w-8 h-8 rounded-lg hover:bg-brand-surface3 flex items-center justify-center text-brand-muted hover:text-brand-accent transition-colors"
                        >
                          <Icons.ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: EXPANDABLE DETAIL DRAWER PANEL (Saves workspace context) */}
      {selectedAppeal && (
        <div className="w-[450px] shrink-0 bg-brand-surface border border-brand-line rounded-xl flex flex-col overflow-hidden shadow-2xl relative select-none animate-fadeIn font-medium">
          {/* Detail Header */}
          <div className="p-4 border-b border-brand-line/60 bg-brand-surface2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-brand-accent tracking-wider uppercase">{selectedAppeal.tracking_code}</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${getPriorityStyle(selectedAppeal.priority)}`}>
                {selectedAppeal.priority_label}
              </span>
            </div>
            <button
              onClick={() => setSelectedAppeal(null)}
              className="w-7 h-7 rounded-lg hover:bg-brand-surface3 flex items-center justify-center text-brand-muted hover:text-brand-text transition-colors"
            >
              <Icons.X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {detailLoading ? (
              <div className="h-48 flex flex-col items-center justify-center space-y-2">
                <Icons.Loader className="animate-spin text-brand-accent" size={20} />
                <span className="text-[11px] text-brand-dim font-bold">Ma'lumotlar yuklanmoqda...</span>
              </div>
            ) : (
              <>
                {/* 1. Appeal Description Info */}
                <div className="space-y-2 bg-brand-surface2/40 p-3.5 border border-brand-line/40 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] text-brand-dim">
                    <span>Yuborilgan vaqt: {new Date(selectedAppeal.created_at).toLocaleString('uz-UZ')}</span>
                    {selectedAppeal.is_overdue && (
                      <span className="text-[#F87171] font-bold uppercase tracking-wider">Muddati o'tgan</span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider">Mazmuni</h3>
                  <p className="text-xs text-brand-text leading-relaxed whitespace-pre-line">{selectedAppeal.text}</p>
                  
                  {/* Photo attachment if available */}
                  {selectedAppeal.image && (
                    <div className="mt-3.5 rounded-lg overflow-hidden border border-brand-line/80 max-h-[160px] bg-brand-surface">
                      <img
                        src={selectedAppeal.image}
                        alt="Murojaat ilovasi"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(selectedAppeal.image, '_blank')}
                      />
                    </div>
                  )}
                </div>

                {/* 2. Interactive Caseworker Operations Controls */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider border-b border-brand-line/50 pb-1.5">Amallar paneli</h3>

                  {/* Operational Action: Reassignment to other agency */}
                  {user.role !== 'operator' && (
                    <div className="flex items-center justify-between p-3.5 border border-amber-500/20 bg-amber-500/5 rounded-xl">
                      <div>
                        <h4 className="text-[11px] font-bold text-amber-500 uppercase">Qayta yo'naltirish</h4>
                        <p className="text-[10px] text-brand-muted mt-0.5">Xato kelgan murojaatni boshqa idoraga yuborish</p>
                      </div>
                      <button
                        onClick={() => {
                          setReassignAgencyId("");
                          setReassignReason("");
                          setShowReassignModal(true);
                        }}
                        className="h-8 px-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-xs transition-colors"
                      >
                        Yo'naltirish
                      </button>
                    </div>
                  )}

                  {/* Assign caseworker */}
                  <div className="space-y-1.5 bg-brand-surface2/30 p-3.5 border border-brand-line/30 rounded-xl">
                    <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">Mas'ul xodimni biriktirish</label>
                    <div className="flex items-center space-x-2">
                      <select
                        value={assignStaffId}
                        onChange={(e) => setAssignStaffId(e.target.value)}
                        className="flex-1 h-9 px-2.5 rounded-lg bg-brand-surface border border-brand-line text-xs font-semibold text-brand-text focus:outline-none focus:border-brand-accent"
                      >
                        <option value="">Tanlang...</option>
                        {staffList
                          .filter(s => s.role === 'operator' && s.agency.id === selectedAppeal.agency.id)
                          .map(s => (
                            <option key={s.id} value={s.id}>{s.full_name}</option>
                          ))
                        }
                      </select>
                      <button
                        onClick={handleAssignStaff}
                        disabled={!assignStaffId}
                        className="h-9 px-3.5 bg-brand-accent disabled:opacity-40 hover:bg-brand-accent/90 text-white font-bold rounded-lg text-xs transition-colors shrink-0"
                      >
                        Biriktirish
                      </button>
                    </div>
                  </div>

                  {/* Progress / Status Update with note */}
                  <div className="space-y-1.5 bg-brand-surface2/30 p-3.5 border border-brand-line/30 rounded-xl">
                    <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">Murojaat holatini o'zgartirish</label>
                    
                    <input
                      type="text"
                      placeholder="Bajarilayotgan ish bo'yicha qisqacha izoh..."
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-lg bg-brand-surface border border-brand-line text-xs text-brand-text placeholder-brand-dim focus:outline-none focus:border-brand-accent"
                    />

                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <button
                        onClick={() => handleStatusChange("reviewing")}
                        className="h-8 rounded-lg bg-[#FBBF24]/10 hover:bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/20 text-[10px] font-bold transition-colors uppercase"
                      >
                        Tekshirish
                      </button>
                      <button
                        onClick={() => handleStatusChange("in_progress")}
                        className="h-8 rounded-lg bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/20 text-[10px] font-bold transition-colors uppercase"
                      >
                        Ijro etish
                      </button>
                      <button
                        onClick={() => handleStatusChange("done")}
                        className="h-8 rounded-lg bg-[#3DDC84]/10 hover:bg-[#3DDC84]/20 text-[#3DDC84] border border-[#3DDC84]/20 text-[10px] font-bold transition-colors uppercase"
                      >
                        Yakunlash
                      </button>
                    </div>
                  </div>

                  {/* Add Casework Notes Form (With Internal/External Toggle) */}
                  <div className="space-y-2 bg-brand-surface2/30 p-3.5 border border-brand-line/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">Izoh yoki eslatma yozish</label>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] text-brand-dim font-bold">Ichki xodimlar ko'rishi</span>
                        <button
                          type="button"
                          onClick={() => setIsInternalToggle(!isInternalToggle)}
                          className={`w-7 h-4 rounded-full relative transition-colors ${
                            isInternalToggle ? 'bg-brand-accent' : 'bg-brand-surface3'
                          }`}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${
                            isInternalToggle ? 'left-[15px]' : 'left-0.5'
                          }`}></div>
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      placeholder={isInternalToggle ? "Faqat idora xodimlari ko'radigan muhim eslatma..." : "Fuqaroga dashboardda ko'rinadigan rasmiy tushuntirish izohi..."}
                      value={internalNoteText}
                      onChange={(e) => setInternalNoteText(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-brand-surface border border-brand-line text-xs text-brand-text placeholder-brand-dim focus:outline-none focus:border-brand-accent resize-none"
                    />

                    <div className="flex justify-end">
                      <button
                        onClick={handleAddNote}
                        disabled={!internalNoteText.trim()}
                        className="h-8 px-4 bg-brand-surface3 hover:bg-brand-surface2 border border-brand-line hover:border-brand-accent text-brand-text font-bold rounded-lg text-xs transition-colors"
                      >
                        Yuborish
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Detailed Audit Timeline */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold text-brand-text uppercase tracking-wider border-b border-brand-line/50 pb-1.5">Murojaat tarixi (Timeline)</h3>
                  
                  <div className="space-y-3.5 relative pl-3.5 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-brand-line">
                    {timeline.map((step, idx) => (
                      <div key={idx} className="relative text-xs">
                        {/* Bullet circle */}
                        <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-brand-surface border border-brand-line flex items-center justify-center">
                          <div className="w-1.2 h-1.2 rounded-full bg-brand-accent"></div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-brand-dim font-bold">
                          <span>{step.label}</span>
                          <span>{new Date(step.time).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {step.actor_name && (
                          <p className="text-[10px] text-brand-dim font-semibold mt-0.5">Ijrochi: {step.actor_name}</p>
                        )}

                        {step.note && (
                          <div className={`mt-1 p-2 rounded-lg text-[11px] leading-relaxed ${
                            step.is_internal ? 'bg-[#A78BFA]/5 border border-[#A78BFA]/10 text-[#A78BFA]/90' : 'bg-brand-surface2 text-brand-muted'
                          }`}>
                            {step.is_internal && <span className="font-extrabold text-[9px] uppercase tracking-wider block mb-0.5">[Ichki Eslatma]</span>}
                            {step.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* REASSIGNMENT DIALOG MODAL */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-[420px] bg-brand-surface border border-brand-line p-6 rounded-xl shadow-2xl relative">
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-4 flex items-center space-x-2 text-amber-500">
              <Icons.ShieldAlert size={16} />
              <span>Boshqa idoraga yo'naltirish</span>
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">Maqsadli Idora</label>
                <select
                  value={reassignAgencyId}
                  onChange={(e) => setReassignAgencyId(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs font-semibold text-brand-text focus:outline-none focus:border-brand-accent"
                >
                  <option value="">Tanlang...</option>
                  {agenciesList
                    .filter(a => a.id !== selectedAppeal?.agency?.id && a.slug !== 'hokimlik')
                    .map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))
                  }
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">Yo'naltirish Sababi</label>
                <textarea
                  rows={3}
                  placeholder="Murojaat nima sababdan ushbu idoraga taalluqli ekanini asoslab bering..."
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs text-brand-text placeholder-brand-dim focus:outline-none focus:border-brand-accent resize-none font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="h-10 px-4 rounded-xl border border-brand-line text-brand-muted font-bold text-xs hover:text-brand-text hover:bg-brand-surface2 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleReassignAgency}
                  className="h-10 px-5 bg-brand-accent text-white font-bold text-xs rounded-xl hover:bg-brand-accent/90 transition-colors"
                >
                  Yo'naltirishni tasdiqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BATCH STATUS UPDATE DIALOG MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-[420px] bg-brand-surface border border-brand-line p-6 rounded-xl shadow-2xl relative">
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Icons.Grid size={16} className="text-brand-accent" />
              <span>Guruhli holat o'zgartirish</span>
            </h3>

            <p className="text-xs text-brand-muted leading-relaxed mb-4 font-medium">
              Siz tanlagan <strong>{selectedIds.length} ta</strong> murojaatning barchasiga bir vaqtning o'zida yangi ijro holatini o'rnatasiz.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">Yangi Ijro Holati</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs font-semibold text-brand-text focus:outline-none focus:border-brand-accent"
                >
                  <option value="reviewing">Ko'rib chiqilmoqda</option>
                  <option value="in_progress">Ijroda (Jarayonda)</option>
                  <option value="done">Yakunlangan (Muvaffaqiyatli hal etildi)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">Tizim uchun izoh</label>
                <textarea
                  rows={2.5}
                  placeholder="Guruhli o'zgartirish sababi yoki xulosasi..."
                  value={bulkNote}
                  onChange={(e) => setBulkNote(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs text-brand-text placeholder-brand-dim focus:outline-none focus:border-brand-accent resize-none font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="h-10 px-4 rounded-xl border border-brand-line text-brand-muted font-bold text-xs hover:text-brand-text hover:bg-brand-surface2 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleBulkStatusChange}
                  className="h-10 px-5 bg-brand-accent text-white font-bold text-xs rounded-xl hover:bg-brand-accent/90 transition-colors"
                >
                  Yangilashni tasdiqlash
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
