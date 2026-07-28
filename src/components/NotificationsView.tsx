import { useEffect, useState } from 'react';
import { api } from '../api';
import * as Icons from 'lucide-react';

interface NotificationItem {
  id: number;
  appeal_id: number;
  tracking_code: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationsViewProps {
  onNavigate: (view: string, params?: any) => void;
  onRefreshCount: () => void;
}

export default function NotificationsView({ onNavigate, onRefreshCount }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = () => {
    setLoading(true);
    api.get<{ items: NotificationItem[] }>("/api/me/notifications")
      .then(res => {
        setNotifications(res.items);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load notifications:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: number, appealId: number) => {
    try {
      await api.post(`/api/me/notifications/${id}/read`);
      // Update local state
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      onRefreshCount();
      // Navigate directly to the appeal details
      onNavigate("appeals", { initialAppealId: appealId });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Loop through unread and mark
      const unreads = notifications.filter(n => !n.is_read);
      await Promise.all(unreads.map(n => api.post(`/api/me/notifications/${n.id}/read`)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      onRefreshCount();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6" id="notifications-container">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-bold text-brand-text font-display">Bildirishnomalar</h2>
          <p className="text-xs text-brand-muted">Murojaatlaringiz holati o'zgarganda tizim tomonidan kelgan xabarlar.</p>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={handleMarkAllRead}
            className="text-xs text-brand-accent hover:underline font-semibold"
          >
            Barchasini o'qilgan deb belgilash
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-brand-surface border border-brand-line h-20 shimmer rounded-[14px]" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-brand-line rounded-[18px] bg-brand-surface">
          <Icons.BellOff className="mx-auto text-brand-dim mb-3 animate-pulse" size={32} />
          <p className="text-sm text-brand-muted font-medium">Hozircha bildirishnomalar yo'q.</p>
        </div>
      ) : (
        <div className="space-y-3" id="notifications-list">
          {notifications.map((item) => (
            <div 
              key={item.id}
              onClick={() => handleMarkAsRead(item.id, item.appeal_id)}
              className={`p-4 rounded-[14px] border transition-all cursor-pointer flex gap-4 ${item.is_read ? 'bg-brand-surface border-brand-line' : 'bg-brand-surface2 border-brand-accent/30 hover:border-brand-accent/50'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${item.is_read ? 'bg-brand-surface2 text-brand-dim' : 'bg-brand-accent-glow text-brand-accent'}`}>
                {item.is_read ? <Icons.Bell size={14} /> : <Icons.BellRing size={14} className="animate-bounce" />}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-brand-dim">{item.tracking_code}</span>
                  <span className="text-[10px] text-brand-dim font-semibold">{new Date(item.created_at).toLocaleDateString('uz-UZ')}</span>
                </div>

                <h4 className={`text-xs font-bold leading-tight ${item.is_read ? 'text-brand-text' : 'text-brand-accent'}`}>
                  {item.title}
                </h4>
                
                <p className="text-xs text-brand-muted line-clamp-2">{item.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
