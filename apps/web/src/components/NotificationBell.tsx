'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Notification {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [data, setData] = useState<{ notifications: Notification[]; unreadCount: number } | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const d = await api.get<{ notifications: Notification[]; unreadCount: number }>('/api/notifications');
      setData(d);
    } catch {
      // not authed yet
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function markRead(id: string) {
    try {
      await api.put(`/api/notifications/${id}/read`);
      load();
    } catch { /* ignore */ }
  }

  async function markAllRead() {
    try {
      await api.put('/api/notifications/read-all');
      load();
    } catch { /* ignore */ }
  }

  const unread = data?.unreadCount || 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center w-8 h-8 rounded-btn hover:bg-white/10 transition-colors text-warm-gray hover:text-warm-white"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-spark text-ink text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-ink border border-white/15 rounded-modal shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-warm-white text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-gold text-xs hover:text-spark transition-colors">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!data?.notifications.length ? (
              <div className="px-4 py-8 text-center">
                <div className="text-2xl mb-2">🔕</div>
                <p className="text-warm-gray text-sm">No notifications yet</p>
              </div>
            ) : (
              data.notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!n.read ? 'bg-white/5' : ''}`}
                  onClick={() => { markRead(n.id); setOpen(false); }}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${n.read ? 'text-warm-gray' : 'text-warm-white'}`}>
                      {n.message}
                    </p>
                    <p className="text-warm-gray/60 text-[10px] mt-1">
                      {new Date(n.createdAt).toLocaleString('en-EG', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 bg-spark rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
