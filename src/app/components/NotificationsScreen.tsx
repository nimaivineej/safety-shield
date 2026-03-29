import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Volume2, Vibrate, AlertCircle, Users, FileText, ChevronRight } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { authService } from '../../services/auth.service';
import { settingsService } from '../../services/settings.service';

export function NotificationsScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  const [settings, setSettings] = useState(settingsService.getSettings());
  const user = authService.getCurrentUser();
  
  // Use path-based mode detection for consistent dual-role experience
  const isVolunteer = location.pathname.startsWith('/volunteer/');
  const backPath = isVolunteer ? '/volunteer-profile' : '/profile';
  
  // Theme constants
  const primaryGradient = isVolunteer ? 'from-green-600 to-teal-500' : 'from-purple-600 to-blue-500';
  const primaryColor = isVolunteer ? 'text-green-600' : 'text-purple-600';
  const primaryBg = isVolunteer ? 'bg-green-100' : 'bg-purple-100';
  const toggleActiveBg = isVolunteer ? 'bg-green-600' : 'bg-purple-600';
  const screenBg = isVolunteer ? 'from-green-50 via-white to-teal-50' : 'from-purple-50 via-white to-blue-50';

  useEffect(() => {
    settingsService.syncWithServer().then(setSettings);
  }, []);

  const toggle = async (key: keyof typeof settings) => {
    const newVal = !settings[key as keyof typeof settings];
    setSettings((prev) => ({ ...prev, [key]: newVal }));
    await settingsService.updateSettings({ [key]: newVal });
  };

  const Toggle = ({ id, value, onChange }: { id: string; value: boolean; onChange: () => void }) => (
    <button
      id={id}
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        value ? toggleActiveBg : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const Row = ({
    icon: Icon,
    label,
    sub,
    settingKey,
    color,
    bg,
  }: {
    icon: any;
    label: string;
    sub: string;
    settingKey: keyof typeof settings;
    color?: string;
    bg?: string;
  }) => (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
      <div className={`w-10 h-10 ${bg || primaryBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color || primaryColor}`} />
      </div>
      <div className="flex-1 text-left">
        <p className="font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{sub}</p>
      </div>
      <Toggle id={settingKey} value={settings[settingKey] as boolean} onChange={() => toggle(settingKey)} />
    </div>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br ${screenBg} pb-20`}>
      <div className={`bg-gradient-to-r ${primaryGradient} text-white p-6`}>
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate(backPath)}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-purple-100">Manage your alert preferences</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Alert Types */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Bell className={`w-5 h-5 ${primaryColor}`} /> Alert Types
            </h2>
          </div>
          <Row icon={AlertCircle} label="SOS Alerts" sub="Receive SOS emergency notifications" settingKey="sosAlerts" color="text-red-600" bg="bg-red-100" />
          <Row icon={FileText} label="Incident Updates" sub="Updates on reported incidents" settingKey="incidentUpdates" color={isVolunteer ? 'text-green-600' : 'text-purple-600'} bg={isVolunteer ? 'bg-green-100' : 'bg-purple-100'} />
          <Row icon={Users} label="Volunteer Nearby" sub="When a volunteer is near you" settingKey="volunteerNearby" color="text-green-600" bg="bg-green-100" />
        </div>

        {/* Sound & Vibration */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-blue-600" /> Sound & Vibration
            </h2>
          </div>
          <Row icon={Volume2} label="App Sounds" sub="Play sounds for alerts" settingKey="appSounds" color="text-blue-600" bg="bg-blue-100" />
          <Row icon={Vibrate} label="Vibration" sub="Vibrate for notifications" settingKey="vibration" color="text-teal-600" bg="bg-teal-100" />
        </div>

        {/* Delivery Channels */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-orange-600" /> Delivery Channels
            </h2>
          </div>
          <Row icon={Bell} label="Email Alerts" sub="Receive alerts via email" settingKey="emailAlerts" color="text-orange-600" bg="bg-orange-100" />
          <Row icon={Bell} label="SMS Alerts" sub="Receive alerts via SMS" settingKey="smsAlerts" color="text-pink-600" bg="bg-pink-100" />
        </div>

        <div className={`${isVolunteer ? 'bg-green-50' : 'bg-purple-50'} rounded-2xl p-4 text-center`}>
          <p className={`text-sm ${isVolunteer ? 'text-green-700' : 'text-purple-700'}`}>Settings are saved automatically</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
