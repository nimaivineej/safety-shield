import { useNavigate } from 'react-router-dom';
import { AlertCircle, Users, FileText, Map, PhoneCall, Shield } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { Button } from './ui/button';
import { authService } from '../../services/auth.service';

export function HomeScreen() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  const quickActions = [
    {
      icon: Users,
      label: 'Emergency Contacts',
      description: 'Manage trusted contacts',
      color: 'from-blue-500 to-blue-600',
      path: '/emergency-contacts',
    },
    {
      icon: FileText,
      label: 'Report Incident',
      description: 'Report unsafe situations',
      color: 'from-orange-500 to-orange-600',
      path: '/report-incident',
    },
    {
      icon: Map,
      label: 'Safe Route Map',
      description: 'Find safe routes',
      color: 'from-green-500 to-green-600',
      path: '/safe-route',
    },
    {
      icon: Shield,
      label: 'Volunteer Help',
      description: 'Nearby assistance',
      color: 'from-purple-500 to-purple-600',
      path: '/volunteer',
    },
  ];

  const emergencyHelplines = [
    { name: 'Police Emergency', number: '100' },
    { name: 'Women Helpline', number: '1091' },
    { name: 'Ambulance', number: '108' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Hi, {user?.name || 'User'} 👋</h1>
            <p className="text-purple-100">Stay Safe, Stay Connected</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* SOS Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => navigate('/sos-alert')}
            className="relative w-48 h-48 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-2xl flex items-center justify-center transition-transform active:scale-95 hover:shadow-red-500/50"
          >
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20"></div>
            <div className="relative text-center">
              <AlertCircle className="w-20 h-20 text-white mx-auto mb-2" strokeWidth={2.5} />
              <span className="text-3xl font-bold text-white">SOS</span>
            </div>
          </button>
          <p className="text-gray-600 mt-4 text-center">Press for Emergency Alert</p>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="bg-white rounded-3xl p-5 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-2xl flex items-center justify-center mb-3`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-left mb-1">{action.label}</h3>
                  <p className="text-sm text-gray-500 text-left">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Emergency Helplines */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Helplines</h2>
          <div className="bg-white rounded-3xl shadow-md overflow-hidden">
            {emergencyHelplines.map((helpline, index) => (
              <div
                key={helpline.number}
                className={`flex items-center justify-between p-4 ${index !== emergencyHelplines.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{helpline.name}</h3>
                  <p className="text-sm text-gray-500">{helpline.number}</p>
                </div>
                <button
                  onClick={() => window.location.href = `tel:${helpline.number}`}
                  className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
                  <PhoneCall className="w-6 h-6 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
