import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, Shield, Trash2, Key } from 'lucide-react';
import { authService } from '../../services/auth.service';
import { BottomNav } from './BottomNav';
import { Button } from './ui/button';
import { settingsService } from '../../services/settings.service';

export function PrivacySecurityScreen() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  
  const [settings, setSettings] = useState(settingsService.getSettings());
  const user = authService.getCurrentUser();
  const isVolunteer = user?.role === 'VOLUNTEER';
  const backPath = isVolunteer ? '/volunteer-profile' : '/profile';

  // Theme constants
  const primaryGradient = isVolunteer ? 'from-green-600 to-teal-500' : 'from-purple-600 to-blue-500';
  const toggleActiveBg = isVolunteer ? 'bg-green-600' : 'bg-purple-600';
  const screenBg = isVolunteer ? 'from-green-50 via-white to-teal-50' : 'from-purple-50 via-white to-blue-50';
  const primaryColor = isVolunteer ? 'text-green-600' : 'text-purple-600';
  const primaryBg = isVolunteer ? 'bg-green-100' : 'bg-purple-100';

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
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br ${screenBg} pb-20`}>
      <div className={`bg-gradient-to-r ${primaryGradient} text-white p-6`}>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(backPath)}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Privacy & Security</h1>
            <p className={`${isVolunteer ? 'text-green-50' : 'text-purple-100'}`}>Control your data and account</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Privacy */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Eye className={`w-5 h-5 ${primaryColor}`} /> Privacy
            </h2>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className={`w-10 h-10 ${primaryBg} rounded-xl flex items-center justify-center`}>
              <Shield className={`w-5 h-5 ${primaryColor}`} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Location Sharing</p>
              <p className="text-sm text-gray-500">Share location during SOS/incidents</p>
            </div>
            <Toggle value={settings.locationSharing} onChange={() => toggle('locationSharing')} />
          </div>
          <div className="flex items-center gap-4 p-4 border-t border-gray-100">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Data Collection</p>
              <p className="text-sm text-gray-500">Help improve the app with usage data</p>
            </div>
            <Toggle value={settings.dataCollection} onChange={() => toggle('dataCollection')} />
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-600" /> Security
            </h2>
          </div>
          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Extra security for your account</p>
            </div>
            <Toggle value={settings.twoFactor} onChange={() => toggle('twoFactor')} />
          </div>
          <div className="border-t border-gray-100">
            <button
              onClick={() => navigate('/forgot-password')}
              className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Lock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900">Change Password</p>
                <p className="text-sm text-gray-500">Update your account password</p>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
          <div className="border-t border-gray-100 p-4">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="w-full flex items-center gap-2 text-sm text-gray-500 justify-center"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPassword ? 'Hide' : 'Show'} last login info
            </button>
            {showPassword && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 text-center">
                Last login: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-red-100">
          <div className="p-4 border-b border-red-100">
            <h2 className="font-bold text-red-700 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Danger Zone
            </h2>
          </div>
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
                  alert('Account deletion requested. Our team will process this within 48 hours.');
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete My Account
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
