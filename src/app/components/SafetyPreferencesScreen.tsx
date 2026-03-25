import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, AlertTriangle, Users, Clock } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { settingsService, AppSettings } from '../../services/settings.service';

export function SafetyPreferencesScreen() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(settingsService.getSettings());

  const toggle = (key: keyof typeof settings) => {
    const newVal = !settings[key as keyof typeof settings];
    setSettings((prev) => ({ ...prev, [key]: newVal }));
    settingsService.updateSettings({ [key]: newVal });
  };

  const updateDelay = (key: 'sosDelay' | 'checkInInterval', val: string) => {
    setSettings((prev) => ({ ...prev, [key]: val }));
    settingsService.updateSettings({ [key]: val });
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
        value ? 'bg-purple-600' : 'bg-gray-200'
      }`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-20">
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/profile')} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Safety Preferences</h1>
            <p className="text-purple-100">Customize your safety features</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* SOS Settings */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> SOS Settings
            </h2>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Auto SOS</p>
              <p className="text-sm text-gray-500">Trigger SOS if no activity detected</p>
            </div>
            <Toggle value={settings.autoSOS} onChange={() => toggle('autoSOS')} />
          </div>
          <div className="flex items-center gap-4 p-4 border-t border-gray-100">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Shake to SOS</p>
              <p className="text-sm text-gray-500">Shake phone vigorously to trigger SOS</p>
            </div>
            <Toggle value={settings.shakeToSOS} onChange={() => toggle('shakeToSOS')} />
          </div>
          <div className="p-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">SOS countdown delay (seconds)</p>
            <div className="grid grid-cols-4 gap-2">
              {['3', '5', '10', '15'].map((v) => (
                <button key={v} onClick={() => updateDelay('sosDelay', v)}
                  className={`py-2 rounded-xl border-2 font-semibold text-sm transition-colors ${settings.sosDelay === v ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:border-red-300'}`}>
                  {v}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Check-in */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" /> Check-In Reminders
            </h2>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Enable Check-Ins</p>
              <p className="text-sm text-gray-500">Periodic safety check-in reminders</p>
            </div>
            <Toggle value={settings.checkInReminders} onChange={() => toggle('checkInReminders')} />
          </div>
          {settings.checkInReminders && (
            <div className="p-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-700 mb-2">Check-in interval (minutes)</p>
              <div className="grid grid-cols-4 gap-2">
                {['15', '30', '60', '120'].map((v) => (
                  <button key={v} onClick={() => updateDelay('checkInInterval', v)}
                    className={`py-2 rounded-xl border-2 font-semibold text-sm transition-colors ${settings.checkInInterval === v ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                    {v}m
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Zone Alerts */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" /> Zone Alerts
            </h2>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Safe/Risk Zone Alerts</p>
              <p className="text-sm text-gray-500">Alert when entering risk zones</p>
            </div>
            <Toggle value={settings.safeZoneAlerts} onChange={() => toggle('safeZoneAlerts')} />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
