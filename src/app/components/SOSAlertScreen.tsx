import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Phone, MessageCircle, MapPin, X, CheckCircle, Loader } from 'lucide-react';
import { Button } from './ui/button';
import { sosService } from '../../services/sos.service';
import { emergencyContactsService, EmergencyContact } from '../../services/emergency-contacts.service';
import { settingsService } from '../../services/settings.service';
import { sendEmergencySms } from '../../services/sms.service';

export function SOSAlertScreen() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(() => {
    const delay = settingsService.getSettings().sosDelay;
    return parseInt(delay || '3', 10);
  });
  const [alertSent, setAlertSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [alertId, setAlertId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation({ latitude: 28.6139, longitude: 77.2090 });
        }
      );
    }
    // Fetch emergency contacts for the contact card on success screen
    emergencyContactsService.getContacts()
      .then(setContacts)
      .catch(() => setContacts([]));
  }, []);

  // Countdown and send alert
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!alertSent && !loading) {
      sendSOSAlert();
    }
  }, [countdown, alertSent, loading]);

  const sendSOSAlert = async () => {
    // Use actual location if available, otherwise fall back to default
    // (geolocation can take longer than the 3-second countdown on desktop)
    const currentLocation = location ?? { latitude: 28.6139, longitude: 77.2090 };

    setLoading(true);
    setError('');

    try {
      const response = await sosService.createAlert({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });

      console.log('✅ SOS Alert sent successfully:', response);
      setAlertId(response.data.id);

      // Trigger automatic call to police (simulation)
      setTimeout(() => {
        window.location.href = 'tel:100';
      }, 500);

      // Send silent SMS to all emergency contacts from the user's phone
      if (contacts.length > 0) {
        const mapsLink = `https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`;
        const smsMessage = `🚨 EMERGENCY: I need help! My live location: ${mapsLink} — Sent via SafetyShield`;
        const phoneNumbers = contacts.map((c) => c.phone).filter(Boolean);
        await sendEmergencySms(phoneNumbers, smsMessage);
      }

      setAlertSent(true);
    } catch (err: any) {
      console.error('❌ Failed to send SOS alert:', err);
      setError(err.response?.data?.message || 'Failed to send alert. Please try again.');
      setAlertSent(true); // transition to error screen
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/home');
  };

  const handleResolve = async () => {
    if (alertId) {
      try {
        await sosService.resolveAlert(alertId);
        console.log('✅ Alert resolved');
      } catch (err) {
        console.error('❌ Failed to resolve alert:', err);
      }
    }
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Emergency Alert</h1>
        </div>
        {!alertSent && (
          <button
            onClick={handleCancel}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {!alertSent ? (
          <div className="text-center space-y-6">
            <div className="relative w-48 h-48 mx-auto">
              <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
              <div className="relative w-48 h-48 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl">
                {loading ? (
                  <Loader className="w-16 h-16 text-white animate-spin" />
                ) : (
                  <span className="text-7xl font-bold text-white">{countdown}</span>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {loading ? 'Sending Alert...' : 'Sending Alert...'}
              </h2>
              <p className="text-gray-600">Notifying emergency contacts and authorities</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center space-y-6 w-full max-w-md">
            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <AlertCircle className="w-14 h-14 text-white" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Alert Failed</h2>
              <p className="text-red-600 mb-4">{error}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={sendSOSAlert}
                className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700"
              >
                Try Again
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="w-full h-14 rounded-2xl"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 w-full max-w-md">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Alert Sent Successfully!</h2>
              <p className="text-gray-600">Your emergency contacts and authorities have been notified</p>
            </div>

            {/* Live Location Map Placeholder */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-900">Live Location Shared</h3>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl h-48 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <div className="relative text-center">
                  <MapPin className="w-12 h-12 text-red-500 mx-auto mb-2 animate-bounce" />
                  <p className="text-sm text-gray-600">Your location is being tracked</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>📍 Lat: {location?.latitude.toFixed(4)}</p>
                <p>📍 Lng: {location?.longitude.toFixed(4)}</p>
              </div>
            </div>

            {/* Emergency Contacts — tap to call or SMS */}
            {contacts.length > 0 && (
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-500" />
                  Your Emergency Contacts
                </h3>
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{contact.name}</p>
                        <p className="text-xs text-gray-500">{contact.relationship} · {contact.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`tel:${contact.phone}`}
                          className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-600 hover:bg-green-200"
                          title={`Call ${contact.name}`}
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        <a
                          href={`sms:${contact.phone}?body=${encodeURIComponent(`🚨 EMERGENCY: I need help! My location: https://www.google.com/maps?q=${location?.latitude},${location?.longitude}`)}`}
                          className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200"
                          title={`SMS ${contact.name}`}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Helplines */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-500" />
                Emergency Helplines
              </h3>
              <div className="space-y-3">
                <a
                  href="tel:100"
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <span className="font-medium text-gray-900">Police Emergency</span>
                  <span className="text-blue-600 font-bold">100</span>
                </a>
                <a
                  href="tel:1091"
                  className="flex items-center justify-between p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <span className="font-medium text-gray-900">Women Helpline</span>
                  <span className="text-purple-600 font-bold">1091</span>
                </a>
                <a
                  href="tel:108"
                  className="flex items-center justify-between p-3 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                >
                  <span className="font-medium text-gray-900">Ambulance</span>
                  <span className="text-red-600 font-bold">108</span>
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResolve}
                className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700"
              >
                I'm Safe Now
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="w-full h-14 rounded-2xl"
              >
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
