import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Shield, Bell, Lock, HelpCircle, LogOut, ChevronRight, Loader } from 'lucide-react';
import { Button } from './ui/button';
import { BottomNav } from './BottomNav';
import { authService } from '../../services/auth.service';
import { emergencyContactsService } from '../../services/emergency-contacts.service';

export function ProfileScreen() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [contactCount, setContactCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      navigate('/login-selection');
      return;
    }

    // Fetch emergency contacts count
    emergencyContactsService.getContacts()
      .then((contacts) => setContactCount(contacts.length))
      .catch(() => setContactCount(0))
      .finally(() => setLoading(false));
  }, [navigate]);

  const settingsOptions = [
    { icon: Bell, label: 'Notifications', description: 'Manage alert preferences', path: '/notifications' },
    { icon: Lock, label: 'Privacy & Security', description: 'Control your data', path: '/privacy-security' },
    { icon: MapPin, label: 'Location Settings', description: 'Location sharing options', path: '/location-settings' },
    { icon: Shield, label: 'Safety Preferences', description: 'Customize safety features', path: '/safety-preferences' },
    { icon: HelpCircle, label: 'Help & Support', description: 'Get assistance', path: '/help-support' },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/login-selection');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-10 h-10 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
            <User className="w-12 h-12 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
          <p className="text-purple-100">SafetyShield Member · {user.role || 'USER'}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* User Details */}
        <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>

          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{user.phone || 'Not set'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Member since</p>
              <p className="font-medium text-gray-900">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Emergency Contacts Summary */}
        <button
          onClick={() => navigate('/emergency-contacts')}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg">Emergency Contacts</h3>
                <p className="text-purple-100 text-sm">{loading ? 'Loading...' : `${contactCount} contacts added`}</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        {/* Settings Options */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Settings</h2>
          </div>
          <div>
            {settingsOptions.map((option, index) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.label}
                  onClick={() => navigate(option.path)}
                  className={`w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${index !== settingsOptions.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">{option.label}</h3>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              );
            })}
          </div>
        </div>

        {/* App Info */}
        <div className="bg-purple-50 rounded-2xl p-4 text-center">
          <p className="text-sm text-purple-900 mb-1">SafetyShield v1.0.0</p>
          <p className="text-xs text-purple-600">Your Safety, Our Priority</p>
        </div>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full h-14 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
