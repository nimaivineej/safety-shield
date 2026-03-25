import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin,
    AlertCircle,
    CheckCircle,
    Clock,
    Navigation,
    Users,
    TrendingUp,
    Power,
} from 'lucide-react';
import { Button } from './ui/button';
import { volunteerService, Incident, VolunteerStats } from '../../services/volunteer.service';
import { VolunteerBottomNav } from './VolunteerBottomNav';

export function VolunteerDashboard() {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [stats, setStats] = useState<VolunteerStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAvailable, setIsAvailable] = useState(true);
    // selectedIncident removed — navigation handled by router
    const [volunteerLocation, setVolunteerLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        loadData();
        getCurrentLocation();

        // Refresh data every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch incidents and stats separately so one failure doesn't block the other
            const incidentsPromise = volunteerService.getNearbyIncidents(50);
            const statsPromise = volunteerService.getVolunteerStats();

            const results = await Promise.allSettled([incidentsPromise, statsPromise]);

            if (results[0].status === 'fulfilled') {
                const rawIncidents = results[0].value.data || [];
                setIncidents(rawIncidents.filter((inc: any) => inc.status !== 'RESOLVED' && inc.status !== 'CLOSED'));
            } else {
                console.error('Failed to load incidents:', results[0].reason);
            }

            if (results[1].status === 'fulfilled') {
                setStats(results[1].value.data);
            } else {
                console.error('Failed to load stats (user might not have a volunteer profile yet):', results[1].reason);
            }
        } catch (error) {
            console.error('Unexpected error in loadData:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setVolunteerLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => console.error('Error getting location:', error)
            );
        }
    };

    const handleAcceptIncident = async (incident: Incident) => {
        try {
            await volunteerService.acceptIncident(incident.id);
            alert('Incident accepted! Navigate to the location.');
            loadData();
            navigate(`/volunteer/incident/${incident.id}`);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to accept incident');
        }
    };

    const handleToggleAvailability = async () => {
        try {
            await volunteerService.updateAvailability(!isAvailable);
            setIsAvailable(!isAvailable);
        } catch (error) {
            console.error('Failed to update availability:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-red-500';
            case 'ACCEPTED':
            case 'INVESTIGATING': return 'bg-yellow-500';
            case 'EN_ROUTE': return 'bg-blue-500';
            case 'ARRIVED': return 'bg-green-500';
            case 'RESOLVED': return 'bg-gray-400';
            default: return 'bg-gray-500';
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'text-red-600 bg-red-50';
            case 'HIGH': return 'text-orange-600 bg-orange-50';
            case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
            case 'LOW': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60); // minutes

        if (diff < 1) return 'Just now';
        if (diff < 60) return `${diff}m ago`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
        return `${Math.floor(diff / 1440)}d ago`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading incidents...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-teal-500 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Volunteer Dashboard</h1>
                                <p className="text-sm text-gray-600">Help your community stay safe</p>
                            </div>
                        </div>

                        <button
                            onClick={handleToggleAvailability}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${isAvailable
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                }`}
                        >
                            <Power className="w-5 h-5" />
                            {isAvailable ? 'Available' : 'Offline'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.activeIncidents}</p>
                                    <p className="text-sm text-gray-600">Active</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.completedIncidents}</p>
                                    <p className="text-sm text-gray-600">Completed</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalIncidents}</p>
                                    <p className="text-sm text-gray-600">Total</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Incidents List */}
            <div className="max-w-7xl mx-auto px-4 pb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                        Nearby Incidents ({incidents.length})
                    </h2>
                    <button
                        onClick={loadData}
                        className="text-sm text-green-600 font-semibold hover:text-green-700"
                    >
                        Refresh
                    </button>
                </div>

                {incidents.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">All Clear!</h3>
                        <p className="text-gray-600">No active incidents in your area</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {incidents.map((incident) => (
                            <div
                                key={incident.id}
                                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(incident.severity)}`}>
                                                {incident.severity}
                                            </span>
                                            <span className={`w-2 h-2 rounded-full ${getStatusColor(incident.status)}`}></span>
                                            <span className="text-xs text-gray-600">{incident.status}</span>
                                        </div>

                                        <h3 className="font-semibold text-gray-900 mb-1">{incident.type}</h3>
                                        <p className="text-sm text-gray-600 mb-2">{incident.description}</p>

                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                <span>{incident.location.address || 'Location available'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{formatTime(incident.createdAt)}</span>
                                            </div>
                                            {incident.distance && (
                                                <div className="flex items-center gap-1">
                                                    <Navigation className="w-4 h-4" />
                                                    <span>{incident.distance.toFixed(1)} km away</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {incident.status === 'PENDING' && (
                                    <Button
                                        onClick={() => handleAcceptIncident(incident)}
                                        className="w-full bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white rounded-xl mb-2"
                                    >
                                        Accept & Respond
                                    </Button>
                                )}

                                {/* View Details is always visible for every incident */}
                                <Button
                                    onClick={() => navigate(`/volunteer/incident/${incident.id}`)}
                                    className="w-full px-6 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl"
                                >
                                    View Details
                                </Button>

                                {incident.status !== 'PENDING' && incident.acceptedBy && (
                                    <div className="bg-gray-50 rounded-xl p-3 mt-2">
                                        <p className="text-sm text-gray-600">
                                            Handled by: <span className="font-semibold">{incident.acceptedBy.name}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <VolunteerBottomNav />
        </div>
    );
}
