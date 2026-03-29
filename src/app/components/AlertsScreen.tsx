import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertCircle, FileText, Users, CheckCircle, Clock, Loader } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { authService } from '../../services/auth.service';
import { notificationService } from '../../services/notification.service';

const iconMap: Record<string, any> = {
  SOS_ALERT: AlertCircle,
  INCIDENT_UPDATE: FileText,
  VOLUNTEER_RESPONSE: Users,
  SYSTEM: Bell,
};

const colorMap: Record<string, string> = {
  SOS_ALERT: 'bg-red-100 text-red-600',
  INCIDENT_UPDATE: 'bg-orange-100 text-orange-600',
  VOLUNTEER_RESPONSE: 'bg-green-100 text-green-600',
  SYSTEM: 'bg-blue-100 text-blue-600',
};

  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isVolunteer = user?.role === 'VOLUNTEER';

  // Theme constants
  const primaryGradient = isVolunteer ? 'from-green-600 to-teal-500' : 'from-purple-600 to-blue-500';
  const primaryColor = isVolunteer ? 'text-green-600' : 'text-purple-600';
  const primaryBg = isVolunteer ? 'bg-green-100' : 'bg-purple-100';
  const screenBg = isVolunteer ? 'from-green-50 via-white to-teal-50' : 'from-purple-50 via-white to-blue-50';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationService
      .getNotifications()
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {}
  };

  const unread = notifications.filter((n) => !n.isRead).length;
  
  return (
    <div className={`min-h-screen bg-gradient-to-br ${screenBg} pb-20`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${primaryGradient} text-white p-6 rounded-b-3xl shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6" /> Alerts
            </h1>
            <p className={`${isVolunteer ? 'text-green-50' : 'text-purple-100'} mt-1`}>
              {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full font-medium transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">No alerts yet</h3>
            <p className="text-sm text-gray-400 mt-2 max-w-xs">
              You'll see SOS alerts, incident updates, and volunteer responses here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const Icon = iconMap[notif.type] || Bell;
              const colorClass = colorMap[notif.type] || 'bg-purple-100 text-purple-600';
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                  className={`bg-white rounded-2xl p-4 shadow-sm flex items-start gap-4 cursor-pointer transition-all border-2 ${
                    notif.isRead ? 'border-transparent opacity-75' : isVolunteer ? 'border-green-200' : 'border-purple-200'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-semibold text-gray-900 ${!notif.isRead ? (isVolunteer ? 'text-green-900' : 'text-purple-900') : ''}`}>{notif.title}</p>
                      {!notif.isRead && <span className={`w-2.5 h-2.5 rounded-full ${isVolunteer ? 'bg-green-600' : 'bg-purple-600'} flex-shrink-0 mt-1`} />}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 leading-snug">{notif.message}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {notifications.length > 0 && notifications.every((n) => n.isRead) && (
          <div className="flex items-center justify-center gap-2 mt-6 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-medium">All notifications read</span>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
