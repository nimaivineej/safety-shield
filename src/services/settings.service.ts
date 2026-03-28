import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

const SETTINGS_KEY = 'safety_app_settings';

export interface AppSettings {
  // Notifications
  sosAlerts: boolean;
  incidentUpdates: boolean;
  volunteerNearby: boolean;
  appSounds: boolean;
  vibration: boolean;
  emailAlerts: boolean;
  smsAlerts: boolean;
  
  // Privacy & Security
  locationSharing: boolean;
  dataCollection: boolean;
  twoFactor: boolean;

  // Location
  highAccuracy: boolean;
  backgroundTracking: boolean;
  autoShareSOS: boolean;
  saveHistory: boolean;
  locationInterval: string;

  // Safety Preferences
  autoSOS: boolean;
  shakeToSOS: boolean;
  checkInReminders: boolean;
  safeZoneAlerts: boolean;
  sosDelay: string;
  checkInInterval: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  sosAlerts: true,
  incidentUpdates: true,
  volunteerNearby: true,
  appSounds: true,
  vibration: true,
  emailAlerts: false,
  smsAlerts: true,
  locationSharing: true,
  dataCollection: true,
  twoFactor: false,
  highAccuracy: true,
  backgroundTracking: false,
  autoShareSOS: true,
  saveHistory: true,
  locationInterval: '30',
  autoSOS: true,
  shakeToSOS: false,
  checkInReminders: true,
  safeZoneAlerts: true,
  sosDelay: '5',
  checkInInterval: '60',
};

export const settingsService = {
  getSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
    return DEFAULT_SETTINGS;
  },

  async syncWithServer(): Promise<AppSettings> {
    try {
      const response = await api.get(API_ENDPOINTS.SETTINGS);
      const serverSettings = response.data.data;
      if (serverSettings) {
        const current = this.getSettings();
        const merged = { ...current, ...serverSettings };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      console.error('Failed to sync settings with server', e);
    }
    return this.getSettings();
  },

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = this.getSettings();
    const newSettings = { ...current, ...updates };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    
    // Dispatch an event so other parts of the app can react (like muting sounds)
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: newSettings }));
    
    // Sync with backend if it's a notification setting
    const notificationKeys = ['sosAlerts', 'incidentUpdates', 'volunteerNearby', 'appSounds', 'vibration', 'emailAlerts', 'smsAlerts'];
    const hasNotificationUpdate = Object.keys(updates).some(key => notificationKeys.includes(key));
    
    if (hasNotificationUpdate) {
      try {
        await api.put(API_ENDPOINTS.SETTINGS, updates);
      } catch (e) {
        console.error('Failed to update settings on server', e);
      }
    }
    
    return newSettings;
  },

  resetSettings(): AppSettings {
    localStorage.removeItem(SETTINGS_KEY);
    window.dispatchEvent(new CustomEvent('settingsChanged', { detail: DEFAULT_SETTINGS }));
    return DEFAULT_SETTINGS;
  }
};
