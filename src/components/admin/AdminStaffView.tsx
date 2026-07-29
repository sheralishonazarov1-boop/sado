import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { adminApi } from '../../api';

interface AdminStaffProps {
  user: any;
  adminToken: string;
}

export default function AdminStaffView({ user, adminToken }: AdminStaffProps) {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [staffRole, setStaffRole] = useState("operator");
  const [agencyId, setAgencyId] = useState(String(user.agency?.id || ""));

  const [tempPasswordReveal, setTempPasswordReveal] = useState<{ name: string, pass: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [agenciesList, setAgenciesList] = useState<any[]>([]);

  const triggerToast = (text: string) => {
    setToast(text);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await adminApi.get<any>("/api/admin/users");
      setStaff(data.items || []);
    } catch (err) {
      console.error("Staff load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const data = await adminApi.get<any>("/api/public/agencies");
      setAgenciesList(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchAgencies();
  }, [adminToken]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !fullName.trim() || !password.trim()) {
      setError("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }

    try {
      await adminApi.post<any>("/api/admin/users", {
        username,
        full_name: fullName,
        role: staffRole,
        password,
        agency_id: agencyId
      });

      triggerToast("Yangi xodim muvaffaqiyatli qo'shildi.");
      setUsername("");
      setFullName("");
      setPassword("");
      setShowAddModal(false);
      fetchStaff();
    } catch (err: any) {
      setError(err.detail || err.message);
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      await adminApi.patch<any>(`/api/admin/users/${id}`, { is_active: !currentActive });

      triggerToast("Xodim faollik holati o'zgartirildi.");
      fetchStaff();
    } catch (err: any) {
      triggerToast(err.detail || err.message);
    }
  };

  const handleResetPassword = async (id: number, staffName: string) => {
    if (!window.confirm(`${staffName} parolini qayta o'rnatmoqchimisiz?`)) return;

    try {
      const data = await adminApi.post<any>(`/api/admin/users/${id}/reset-password`);

      setTempPasswordReveal({
        name: staffName,
        pass: data.temp_password
      });
      fetchStaff();
    } catch (err: any) {
      triggerToast(err.detail || err.message);
    }
  };

  return (
    <div className="space-y-4 max-w-[1200px] mx-auto pb-8 select-none relative font-medium">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#3DDC84]/15 border border-[#3DDC84]/30 text-[#3DDC84] px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 animate-fadeIn text-xs font-bold">
          <Icons.CheckCircle size={15} />
          <span>{toast}</span>
        </div>
      )}

      {/* Temp Password Reveal Box */}
      {tempPasswordReveal && (
        <div className="p-4 bg-brand-accent/15 border border-brand-accent/40 rounded-xl flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <Icons.Key size={20} className="text-brand-accent shrink-0 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-brand-text">
                {tempPasswordReveal.name} uchun yangi vaqtinchalik parol yaratildi:
              </p>
              <p className="text-sm font-mono font-extrabold text-brand-accent tracking-wider mt-1 select-all">
                {tempPasswordReveal.pass}
              </p>
            </div>
          </div>
          <button
            onClick={() => setTempPasswordReveal(null)}
            className="text-xs text-brand-muted hover:text-brand-text font-bold"
          >
            Yopish
          </button>
        </div>
      )}

      {/* Table & controls wrapper */}
      <div className="bg-brand-surface border border-brand-line rounded-xl flex flex-col overflow-hidden">
        {/* Controls header */}
        <div className="p-4 border-b border-brand-line/60 bg-brand-surface flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-brand-text uppercase tracking-wider">Xodimlar ro'yxati</h2>
            <p className="text-[10px] text-brand-dim mt-0.5 uppercase tracking-wide">
              {user.role === 'super_admin' ? "Barcha idoralar xodimlari" : "Sizning idorangiz xodimlari"}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="h-9 px-4 bg-brand-accent hover:bg-brand-accent/90 text-white font-bold rounded-lg text-xs flex items-center space-x-2 transition-colors shadow-md"
          >
            <Icons.UserPlus size={14} />
            <span>Yangi xodim qo'shish</span>
          </button>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <Icons.Loader className="animate-spin text-brand-accent mx-auto" size={24} />
              <p className="text-xs text-brand-muted font-bold mt-2">Xodimlar ro'yxati yuklanmoqda...</p>
            </div>
          ) : staff.length === 0 ? (
            <p className="p-12 text-center text-xs text-brand-dim">Xodimlar topilmadi.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-line text-[11px] text-brand-dim font-bold uppercase tracking-wider bg-brand-surface2/30 h-10 select-none">
                  <th className="p-3 pl-4">Xodim</th>
                  <th className="p-3">Login</th>
                  <th className="p-3">Idorasi</th>
                  <th className="p-3">Roli</th>
                  <th className="p-3">So'nggi kirish</th>
                  <th className="p-3 w-24 text-center font-bold">Holat</th>
                  <th className="p-3 pr-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-line/40 text-xs">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-brand-surface2/25 h-[48px] transition-colors">
                    <td className="p-3 pl-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-accent/15 text-brand-accent flex items-center justify-center font-bold text-xs select-none">
                          {member.full_name?.charAt(0)}
                        </div>
                        <span className="font-bold text-brand-text">{member.full_name}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-brand-muted font-semibold">@{member.username}</td>
                    <td className="p-3 text-brand-muted font-semibold truncate max-w-[120px]" title={member.agency?.name}>
                      {member.agency?.name}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        member.role === 'super_admin' ? 'bg-red-500/10 text-red-400' : 'bg-brand-accent/10 text-brand-accent'
                      }`}>
                        {member.role === 'super_admin' ? 'SUPER' : member.role === 'agency_admin' ? 'ADMIN' : 'OPERATOR'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-brand-dim">
                      {member.last_login_at ? new Date(member.last_login_at).toLocaleString('uz-UZ') : "Kirilmagan"}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleActive(member.id, member.is_active)}
                        className={`text-[10px] font-extrabold px-2 py-1 rounded uppercase tracking-wider border transition-colors ${
                          member.is_active
                            ? 'bg-[#3DDC84]/10 text-[#3DDC84] border-[#3DDC84]/20 hover:bg-[#3DDC84]/20'
                            : 'bg-brand-dim/15 text-brand-dim border-brand-line hover:bg-brand-surface3'
                        }`}
                      >
                        {member.is_active ? "FAOL" : "BLOKlangan"}
                      </button>
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <button
                        onClick={() => handleResetPassword(member.id, member.full_name)}
                        className="text-[11px] font-bold text-amber-500 hover:underline flex items-center space-x-1 ml-auto"
                        title="Parolni tiklash"
                      >
                        <Icons.RefreshCw size={11} />
                        <span>Parol tiklash</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE STAFF MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none animate-fadeIn">
          <div className="w-full max-w-[420px] bg-brand-surface border border-brand-line p-6 rounded-xl shadow-2xl relative">
            <h3 className="text-sm font-bold text-brand-text uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Icons.UserPlus size={16} className="text-brand-accent" />
              <span>Yangi xodim qo'shish</span>
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 text-red-400 text-xs rounded-lg flex items-start space-x-2">
                <Icons.AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4">
              {/* Ism sharif */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">Foydalanuvchi Ism-Sharifi</label>
                <input
                  type="text"
                  required
                  placeholder="masalan, Jamol Karimov"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs text-brand-text focus:outline-none focus:border-brand-accent"
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">Foydalanuvchi nomi (Login)</label>
                <input
                  type="text"
                  required
                  placeholder="masalan, jamol.operator"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs text-brand-text focus:outline-none focus:border-brand-accent"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">Dastlabki vaqtinchalik parol</label>
                <input
                  type="text"
                  required
                  placeholder="masalan, SadoXodim2026"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs text-brand-text focus:outline-none focus:border-brand-accent"
                />
              </div>

              {/* Roles */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">Roli</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  disabled={user.role !== 'super_admin'}
                  className="w-full h-10 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs font-semibold text-brand-text focus:outline-none focus:border-brand-accent"
                >
                  <option value="operator">Operator (Ijrochi xodim)</option>
                  <option value="agency_admin">Agency Admin (Idora boshlig'i)</option>
                  {user.role === 'super_admin' && (
                    <option value="super_admin">Super Admin (Nazorat rahbariyati)</option>
                  )}
                </select>
              </div>

              {/* Target Agency - Super Admin only can choose */}
              {user.role === 'super_admin' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-brand-muted uppercase tracking-wider block">Tegishli Idorasi</label>
                  <select
                    value={agencyId}
                    onChange={(e) => setAgencyId(e.target.value)}
                    className="w-full h-10 px-2.5 rounded-lg bg-brand-surface2 border border-brand-line text-xs font-semibold text-brand-text focus:outline-none focus:border-brand-accent"
                  >
                    {agenciesList.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-10 px-4 rounded-xl border border-brand-line text-brand-muted font-bold text-xs hover:text-brand-text hover:bg-brand-surface2 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-brand-accent text-white font-bold text-xs rounded-xl hover:bg-brand-accent/90 transition-colors"
                >
                  Qo'shishni tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
