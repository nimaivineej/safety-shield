import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import {
    MapPin,
    Phone,
    Navigation,
    CheckCircle,
    ArrowLeft,
    Clock,
    User,
    Mail,
    AlertTriangle,
    Info,
    Mic,
    Volume2,
    Camera,
} from 'lucide-react';
import { Button } from './ui/button';
import { volunteerService, Incident } from '../../services/volunteer.service';
import { API_CONFIG } from '../../config/api.config';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Shared helper — build full URL from a relative /uploads path
function getMediaUrl(path: string | undefined | null): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const host = API_CONFIG.BASE_URL.replace(/\/api$/, '');
    return `${host}${path.startsWith('/') ? '' : '/'}${path}`;
}

// Fetch media via axios (adds ngrok-skip-browser-warning header automatically)
// and render it as a blob URL so it works anywhere including through ngrok
function SecureMedia({ src, kind, className }: { src: string; kind: 'image' | 'audio'; className?: string }) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [errored, setErrored] = useState(false);

    useEffect(() => {
        if (!src) return;
        let revoked = false;
        let objectUrl: string | null = null;
        // Use the configured api instance (includes ngrok-skip-browser-warning + auth token)
        api.get(src, { responseType: 'blob', baseURL: '' })
            .then(res => {
                if (revoked) return;
                objectUrl = URL.createObjectURL(res.data);
                setBlobUrl(objectUrl);
            })
            .catch(() => setErrored(true));
        return () => {
            revoked = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src]);

    if (errored) return <span className="text-xs text-red-400">Failed to load media</span>;
    if (!blobUrl) return <span className="text-xs text-gray-400 animate-pulse">Loading…</span>;
    if (kind === 'image') return <img src={blobUrl} className={className} alt="incident media" />;
    return <audio controls src={blobUrl} className={className} />;
}

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom red icon for the incident/user location
const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// Custom blue icon for the volunteer location
const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

export function VolunteerIncidentDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Incident data from backend (fetched by ID)
    const [incident, setIncident] = useState<Incident | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Volunteer's own GPS position
    const [volunteerLocation, setVolunteerLocation] = useState<{ lat: number; lng: number } | null>(null);

    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadIncident();
        getCurrentLocation();
    }, [id]);

    /**
     * Fetch the specific incident by its ID using the backend's
     * GET /api/incidents/:id endpoint (via volunteerService.getIncidentById).
     * This is far more reliable than filtering from the full nearby-incidents list.
     */
    const loadIncident = async () => {
        if (!id) return;
        try {
            const response = await volunteerService.getIncidentById(id);
            // Backend wraps data in { success: true, data: { ... } }
            const incidentData = response.data || response;

            // Normalise the shape to match the Incident interface used in the dashboard
            // The /incidents/:id endpoint returns location & user differently to /volunteers/incidents
            const normalised: Incident = {
                id: incidentData.id,
                userId: incidentData.userId,
                type: incidentData.type,
                description: incidentData.description,
                severity: incidentData.severity || 'MEDIUM',
                status: incidentData.status,
                createdAt: incidentData.createdAt,
                voiceNoteUrl: incidentData.voiceNoteUrl ?? undefined,
                photoUrls: incidentData.photoUrls ?? [],
                location: {
                    latitude: incidentData.location?.latitude ?? incidentData.latitude ?? 0,
                    longitude: incidentData.location?.longitude ?? incidentData.longitude ?? 0,
                    address: incidentData.location?.address ?? incidentData.address,
                },
                user: {
                    name: incidentData.user?.name ?? 'Unknown',
                    phone: incidentData.user?.phone ?? '',
                    email: incidentData.user?.email ?? '',
                },
            };
            setIncident(normalised);
        } catch (error) {
            console.error('Failed to load incident:', error);
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
                (error) => console.warn('Geolocation not available:', error)
            );
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!incident) return;
        setUpdating(true);
        try {
            await volunteerService.updateIncidentStatus(incident.id, newStatus);
            alert(`Status updated to ${newStatus}`);
            loadIncident();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleCompleteIncident = async () => {
        if (!incident) return;
        setUpdating(true);
        try {
            await volunteerService.completeIncident(incident.id, notes);
            alert('Incident marked as resolved!');
            navigate('/volunteer-dashboard');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to complete incident');
        } finally {
            setUpdating(false);
        }
    };

    const handleNavigate = () => {
        if (!incident) return;
        const { latitude, longitude } = incident.location;
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
            '_blank'
        );
    };

    const handleCallUser = () => {
        if (!incident?.user.phone) return;
        window.location.href = `tel:${incident.user.phone}`;
    };

    /* ── Loading / Not-found states ── */

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading incident details...</p>
                </div>
            </div>
        );
    }

    if (!incident) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Incident Not Found</h2>
                    <p className="text-gray-600 mb-4">
                        This incident may have been removed or you don't have access.
                    </p>
                    <Button onClick={() => navigate('/volunteer-dashboard')}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const incidentPos: [number, number] = [incident.location.latitude, incident.location.longitude];
    const volunteerPos: [number, number] | null = volunteerLocation
        ? [volunteerLocation.lat, volunteerLocation.lng]
        : null;

    /* ── Severity badge colours ── */
    const severityClass =
        incident.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
            incident.severity === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                incident.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700';

    /* ── Render ── */
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">

            {/* ── Header ── */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <button
                        onClick={() => navigate('/volunteer-dashboard')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Dashboard</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">Incident Details</h1>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${severityClass}`}>
                            {incident.severity}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* ═══════════════════════════════════════
                        LEFT COLUMN – Details
                    ════════════════════════════════════════ */}
                    <div className="space-y-4">

                        {/* User Info */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">User Information</h2>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="font-semibold text-gray-900">{incident.user.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Phone className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="font-semibold text-gray-900">
                                            {incident.user.phone || 'Not provided'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-semibold text-gray-900">{incident.user.email}</p>
                                    </div>
                                </div>
                            </div>

                            {incident.user.phone && (
                                <Button
                                    onClick={handleCallUser}
                                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                                >
                                    <Phone className="w-5 h-5 mr-2" />
                                    Call User
                                </Button>
                            )}
                        </div>

                        {/* Incident Info */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Incident Info</h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">Type</p>
                                    <p className="font-semibold text-gray-900">{incident.type}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <p className="font-semibold text-gray-900">{incident.status}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Description</p>
                                    <p className="text-gray-900">{incident.description}</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm text-gray-600">Address</p>
                                        <p className="text-gray-900">
                                            {incident.location.address || 'Address not available'}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {incident.location.latitude.toFixed(6)}, {incident.location.longitude.toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <div>
                                        <p className="text-sm text-gray-600">Reported</p>
                                        <p className="text-gray-900">{new Date(incident.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleNavigate}
                                className="w-full mt-4 bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white rounded-xl"
                            >
                                <Navigation className="w-5 h-5 mr-2" />
                                Open in Google Maps
                            </Button>
                        </div>

                        {/* Photos */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Camera className="w-5 h-5 text-blue-500" />
                                Photos
                            </h2>

                            {incident.photoUrls && incident.photoUrls.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {incident.photoUrls.map((url, i) => (
                                        <div
                                            key={i}
                                            className="block aspect-square rounded-xl overflow-hidden border border-gray-200"
                                        >
                                            <SecureMedia
                                                src={getMediaUrl(url)}
                                                kind="image"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                        <Camera className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm text-gray-400">No photos attached</p>
                                </div>
                            )}
                        </div>

                        {/* Voice Note */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Mic className="w-5 h-5 text-purple-500" />
                                Voice Note
                            </h2>

                            {incident.voiceNoteUrl ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                                            <Volume2 className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-purple-800 mb-1">Voice note from reporter</p>
                                            <SecureMedia
                                                src={getMediaUrl(incident.voiceNoteUrl)}
                                                kind="audio"
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-center text-gray-400">
                                        🎙 Recorded at time of incident report
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                        <Mic className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm text-gray-400">No voice note attached</p>
                                </div>
                            )}
                        </div>

                        {/* Status Update */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Update Status</h2>
                            <div className="space-y-3">
                                {(incident.status === 'ACCEPTED' || incident.status === 'INVESTIGATING') && (
                                    <div className="space-y-3">
                                        <Button
                                            onClick={() => handleUpdateStatus('EN_ROUTE')}
                                            disabled={updating}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                                        >
                                            <Clock className="w-5 h-5 mr-2" />
                                            Mark as En Route
                                        </Button>
                                    </div>
                                )}

                                {incident.status === 'EN_ROUTE' && (
                                    <Button
                                        onClick={() => handleUpdateStatus('ARRIVED')}
                                        disabled={updating}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl"
                                    >
                                        <MapPin className="w-5 h-5 mr-2" />
                                        Mark as Arrived
                                    </Button>
                                )}

                                {(incident.status === 'ACCEPTED' || incident.status === 'INVESTIGATING' || incident.status === 'ARRIVED' || incident.status === 'EN_ROUTE') && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                        <p className="text-sm font-medium text-gray-700">Final Resolution</p>
                                        <textarea
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Add resolution notes (optional)"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                                            rows={2}
                                        />
                                        <Button
                                            onClick={handleCompleteIncident}
                                            disabled={updating}
                                            className="w-full bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white rounded-xl"
                                        >
                                            <CheckCircle className="w-5 h-5 mr-2" />
                                            Problem Solved
                                        </Button>
                                    </div>
                                )}

                                {incident.status === 'RESOLVED' && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                                        <p className="font-semibold text-green-900">Incident Resolved</p>
                                        <p className="text-sm text-green-700 mt-1">Thank you for your help!</p>
                                    </div>
                                )}

                                {incident.status === 'PENDING' && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-center gap-2 text-sm text-yellow-800">
                                        <Info className="w-4 h-4 shrink-0" />
                                        Accept the incident from the dashboard to update its status.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════
                        RIGHT COLUMN – Incident Location Map
                    ════════════════════════════════════════ */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col h-fit lg:h-[680px]">
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Incident Location</h2>

                        {/* Map Legend */}
                        <div className="flex items-center gap-6 mb-4 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                                <span className="text-gray-600">Incident Location</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                                <span className="text-gray-600">Your Location</span>
                            </div>
                            {!volunteerPos && (
                                <span className="text-xs text-gray-400 italic">
                                    (Allow location access to see your position)
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-h-[420px] rounded-xl overflow-hidden">
                            <MapContainer
                                center={incidentPos}
                                zoom={14}
                                style={{ height: '100%', width: '100%', minHeight: '420px' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {/* 🔴 Red marker – Incident / User location */}
                                <Marker position={incidentPos} icon={redIcon}>
                                    <Popup>
                                        <div className="text-center">
                                            <p className="font-semibold text-red-700">🚨 Incident Location</p>
                                            <p className="text-sm font-medium">{incident.user.name}</p>
                                            {incident.location.address && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {incident.location.address}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                {incident.type} · {incident.severity}
                                            </p>
                                        </div>
                                    </Popup>
                                </Marker>

                                {/* 🔵 Blue marker – Volunteer's current position (if available) */}
                                {volunteerPos && (
                                    <>
                                        <Marker position={volunteerPos} icon={blueIcon}>
                                            <Popup>
                                                <div className="text-center">
                                                    <p className="font-semibold text-blue-700">📍 Your Location</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {volunteerPos[0].toFixed(5)}, {volunteerPos[1].toFixed(5)}
                                                    </p>
                                                </div>
                                            </Popup>
                                        </Marker>

                                        {/* Dashed route line between volunteer and incident */}
                                        <Polyline
                                            positions={[volunteerPos, incidentPos]}
                                            color="#2563eb"
                                            weight={3}
                                            opacity={0.75}
                                            dashArray="10, 10"
                                        />
                                    </>
                                )}
                            </MapContainer>
                        </div>

                        {/* Distance info below map */}
                        {volunteerPos && (
                            <p className="text-sm text-center text-gray-500 mt-3">
                                Approx. distance:{' '}
                                <span className="font-semibold text-gray-800">
                                    {volunteerService.calculateDistance(
                                        volunteerPos[0],
                                        volunteerPos[1],
                                        incidentPos[0],
                                        incidentPos[1]
                                    ).toFixed(2)}{' '}
                                    km
                                </span>
                            </p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
