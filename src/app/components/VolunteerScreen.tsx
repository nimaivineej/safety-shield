import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, CheckCircle, AlertCircle, Phone, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { BottomNav } from './BottomNav';
import { volunteerService, Incident } from '../../services/volunteer.service';
import { authService } from '../../services/auth.service';

export function VolunteerScreen() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await volunteerService.getNearbyIncidents(10); // 10km radius
      const list: Incident[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      // Sort by distance if available, otherwise by createdAt
      list.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
      setIncidents(list);
    } catch (err: any) {
      console.error('Failed to load incidents:', err);
      setError('Failed to load nearby incidents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get user location then fetch incidents
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        () => setUserLocation(null)
      );
    }
    fetchIncidents();
  }, []);

  const handleAccept = async (id: string) => {
    try {
      // Update local state immediately for instant UI feedback
      setIncidents(prev => prev.map(inc =>
        inc.id === id ? { ...inc, status: 'INVESTIGATING' } : inc
      ));
      
      await volunteerService.acceptIncident(id);
      alert('Incident accepted successfully! Please proceed to help.');
    } catch (err: any) {
      console.error('Failed to accept incident:', err);
      // Revert state on failure
      fetchIncidents();
      alert(err.response?.data?.message || 'Failed to accept incident. Please try again.');
    }
  };

  const handleMarkHandled = async (id: string) => {
    try {
      await volunteerService.completeIncident(id);
      setIncidents(incidents.map(inc =>
        inc.id === id ? { ...inc, status: 'RESOLVED' } : inc
      ));
      alert('Thank you for your help! Incident marked as resolved.');
    } catch (err: any) {
      console.error('Failed to complete incident:', err);
      alert(err.response?.data?.message || 'Failed to mark incident as handled.');
    }
  };

  const getDistanceLabel = (incident: Incident): string => {
    if (incident.distance != null) return `${incident.distance.toFixed(1)} km`;
    if (userLocation && incident.location?.latitude && incident.location?.longitude) {
      const d = volunteerService.calculateDistance(
        userLocation.latitude, userLocation.longitude,
        incident.location.latitude, incident.location.longitude
      );
      return `${d.toFixed(1)} km`;
    }
    return 'Unknown distance';
  };

  const getTimeAgo = (dateStr: string): string => {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'from-red-500 to-red-600';
      case 'medium':
        return 'from-orange-500 to-orange-600';
      case 'low':
        return 'from-yellow-500 to-yellow-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'ACCEPTED': case 'EN_ROUTE': case 'INVESTIGATING': return 'bg-blue-100 text-blue-700';
      case 'RESOLVED': case 'ARRIVED': case 'CLOSED': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Volunteer Assistance</h1>
            <p className="text-purple-100">Help people in need</p>
          </div>
          <button
            onClick={fetchIncidents}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-6">

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <RefreshCw className="w-10 h-10 text-purple-400 animate-spin" />
            <p className="text-gray-500">Loading nearby incidents...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={fetchIncidents} className="ml-auto text-red-600 underline text-sm">Retry</button>
          </div>
        )}

        {/* Incidents List */}
        {!loading && (
        <>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Nearby Incidents ({incidents.length})</h2>
          
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-white rounded-3xl shadow-lg overflow-hidden"
            >
              {/* Header with severity indicator */}
              <div className={`bg-gradient-to-r ${getSeverityColor(incident.severity)} px-4 py-3`}>
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">{incident.type.replace(/_/g, ' ')}</span>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(incident.status)} bg-white/20 backdrop-blur`}>
                    {incident.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">
                      {incident.location?.address || `${incident.location?.latitude?.toFixed(4)}, ${incident.location?.longitude?.toFixed(4)}`}
                    </p>
                    <p className="text-sm text-gray-500">{getDistanceLabel(incident)} away</p>
                  </div>
                </div>

                {incident.description && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{incident.description}</p>
                )}

                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{getTimeAgo(incident.createdAt)}</span>
                  {incident.user?.name && <span className="text-gray-400">· Reported by {incident.user.name}</span>}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {incident.status === 'PENDING' && (
                    <>
                      <Button
                        onClick={() => handleAccept(incident.id)}
                        className="flex-1 h-11 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                      >
                        Accept &amp; Help
                      </Button>
                      {incident.location?.latitude && (
                        <a
                          href={`https://www.google.com/maps?q=${incident.location.latitude},${incident.location.longitude}`}
                          target="_blank" rel="noopener noreferrer"
                          className="w-11 h-11 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                        >
                          <MapPin className="w-5 h-5 text-gray-600" />
                        </a>
                      )}
                    </>
                  )}

                  {(incident.status === 'ACCEPTED' || incident.status === 'EN_ROUTE' || incident.status === 'INVESTIGATING') && (
                    <>
                      <Button
                        onClick={() => handleMarkHandled(incident.id)}
                        className="flex-1 h-11 rounded-xl bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Mark as Handled
                      </Button>
                      {incident.user?.phone && (
                        <a
                          href={`tel:${incident.user.phone}`}
                          className="w-11 h-11 rounded-xl border border-green-200 flex items-center justify-center hover:bg-green-50"
                        >
                          <Phone className="w-5 h-5 text-green-600" />
                        </a>
                      )}
                    </>
                  )}

                  {incident.status === 'RESOLVED' && (
                    <div className="flex-1 h-11 rounded-xl bg-green-50 border-2 border-green-200 flex items-center justify-center gap-2 text-green-700 font-medium">
                      <CheckCircle className="w-5 h-5" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!loading && incidents.length === 0 && !error && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No incidents reported nearby</p>
          </div>
        )}
        </>
        )}
        {/* Info Banner */}
        <div className="mt-6 bg-purple-50 rounded-2xl p-4 border-2 border-purple-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-purple-900">
              <p className="font-medium mb-1">How to help as a volunteer:</p>
              <ul className="list-disc list-inside space-y-1 text-purple-700">
                <li>Accept nearby incidents you can assist with</li>
                <li>Navigate to the location and provide help</li>
                <li>Mark as handled once situation is resolved</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
