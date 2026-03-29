import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Navigation, Clock, Globe } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { authService } from '../../services/auth.service';
import { settingsService } from '../../services/settings.service';

export function LocationSettingsScreen() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isVolunteer = user?.role === 'VOLUNTEER';
  const backPath = isVolunteer ? '/volunteer-profile' : '/profile';

  // Theme constants
  const primaryGradient = isVolunteer ? 'from-green-600 to-teal-500' : 'from-purple-600 to-blue-500';
  const primaryColor = isVolunteer ? 'text-green-600' : 'text-purple-600';
  const primaryBg = isVolunteer ? 'bg-green-100' : 'bg-purple-100';
  const toggleActiveBg = isVolunteer ? 'bg-green-600' : 'bg-purple-600';
  const screenBg = isVolunteer ? 'from-green-50 via-white to-teal-50' : 'from-purple-50 via-white to-blue-50';

  const [settings, setSettings] = useState(settingsService.getSettings());

  const toggle = (key: keyof typeof settings) => {
    const newVal = !settings[key as keyof typeof settings];
    setSettings((prev) => ({ ...prev, [key]: newVal }));
    settingsService.updateSettings({ [key]: newVal });
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        value ? toggleActiveBg : 'bg-gray-200'
      }`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br ${screenBg} pb-20`}>
      <div className={`bg-gradient-to-r ${primaryGradient} text-white p-6`}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(backPath)} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Location Settings</h1>
            <p className="text-purple-100">Manage how your location is used</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MapPin className={`w-5 h-5 ${primaryColor}`} /> Location Accuracy
            </h2>
          </div>
          {[
            { key: 'highAccuracy', icon: Navigation, label: 'High Accuracy GPS', sub: 'Uses more battery', color: primaryColor, bg: primaryBg },
            { key: 'backgroundTracking', icon: Globe, label: 'Background Tracking', sub: 'Track when app is closed', color: 'text-blue-600', bg: 'bg-blue-100' },
          ].map(({ key, icon: Icon, label, sub, color, bg }) => (
            <div key={key} className="flex items-center gap-4 p-4 border-t border-gray-100 first:border-t-0">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-sm text-gray-500">{sub}</p>
              </div>
              <Toggle value={settings[key as keyof typeof settings] as boolean} onChange={() => toggle(key as keyof typeof settings)} />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" /> Update Frequency
            </h2>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-500 mb-3">How often to update your location (seconds)</p>
            <div className="grid grid-cols-4 gap-2">
              {['10', '30', '60', '120'].map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setSettings((prev) => ({ ...prev, locationInterval: v }));
                    settingsService.updateSettings({ locationInterval: v });
                  }}
                  className={`py-2 rounded-xl border-2 font-semibold text-sm transition-colors ${
                    settings.locationInterval === v
                      ? `${isVolunteer ? 'border-green-500 bg-green-50 text-green-700' : 'border-purple-500 bg-purple-50 text-purple-700'}`
                      : `${isVolunteer ? 'border-gray-200 text-gray-600 hover:border-green-300' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`
                  }`}
                >
                  {v}s
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" /> Sharing & History
            </h2>
          </div>
          {[
            { key: 'autoShareSOS', label: 'Auto-share during SOS', sub: 'Share location in emergencies', color: 'text-red-600', bg: 'bg-red-100' },
            { key: 'saveHistory', label: 'Save Location History', sub: 'Keep a log of visited places', color: 'text-green-600', bg: 'bg-green-100' },
          ].map(({ key, label, sub, color, bg }) => (
            <div key={key} className="flex items-center gap-4 p-4 border-t border-gray-100 first:border-t-0">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <MapPin className={`w-5 h-5 ${color}`} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-sm text-gray-500">{sub}</p>
              </div>
              <Toggle value={settings[key as keyof typeof settings] as boolean} onChange={() => toggle(key as keyof typeof settings)} />
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
