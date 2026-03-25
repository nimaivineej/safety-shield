import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MapPin,
    RefreshCw,
    Users,
    AlertCircle,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { volunteerService, Incident } from '../../services/volunteer.service';
import { VolunteerBottomNav } from './VolunteerBottomNav';

// Fix default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Severity → marker colour using leaflet-color-markers CDN
const SEVERITY_ICON: Record<string, L.Icon> = {
    CRITICAL: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    }),
    HIGH: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    }),
    MEDIUM: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    }),
    LOW: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    }),
};

const VOLUNTEER_ICON = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const SEVERITY_LABEL: Record<string, { bg: string; text: string }> = {
    CRITICAL: { bg: 'bg-red-100', text: 'text-red-700' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-700' },
    MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    LOW: { bg: 'bg-blue-100', text: 'text-blue-700' },
};

function formatTime(dateString: string) {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
}

export function VolunteerMapScreen() {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [volunteerLocation, setVolunteerLocation] = useState<[number, number] | null>(null);

    // Default centre: New Delhi (fallback if geolocation fails)
    const defaultCenter: [number, number] = [28.6139, 77.209];

    useEffect(() => {
        loadIncidents();
        getLocation();
    }, []);

    const loadIncidents = async () => {
        setLoading(true);
        try {
            const res = await volunteerService.getNearbyIncidents(50);
            setIncidents(res.data || []);
        } catch (e) {
            console.error('Failed to load incidents:', e);
        } finally {
            setLoading(false);
        }
    };

    const getLocation = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => setVolunteerLocation([pos.coords.latitude, pos.coords.longitude]),
            () => setVolunteerLocation(defaultCenter)
        );
    };

    const mapCenter = volunteerLocation ?? defaultCenter;

    return (
        <div className="h-screen flex flex-col bg-gray-900">

            {/* ── Header ── */}
            <div className="bg-white shadow-sm border-b border-gray-200 flex-none z-10">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/volunteer-dashboard')}
                            className="w-9 h-9 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Nearby Incidents Map</h1>
                            <p className="text-xs text-gray-500">
                                {loading ? 'Loading…' : `${incidents.length} incident${incidents.length !== 1 ? 's' : ''} in 50 km radius`}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={loadIncidents}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* ── Map ── */}
            <div className="flex-1 relative min-h-0">
                {loading && incidents.length === 0 ? (
                    <div className="h-full flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-gray-600">Loading incidents…</p>
                        </div>
                    </div>
                ) : (
                    <MapContainer
                        center={mapCenter}
                        zoom={12}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* 🟢 Volunteer location */}
                        {volunteerLocation && (
                            <>
                                <Marker position={volunteerLocation} icon={VOLUNTEER_ICON}>
                                    <Popup>
                                        <p className="font-semibold text-green-700">📍 Your Location</p>
                                    </Popup>
                                </Marker>
                                {/* Soft radius circle — 50 km */}
                                <Circle
                                    center={volunteerLocation}
                                    radius={50000}
                                    pathOptions={{ color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.04, weight: 1.5, dashArray: '6 6' }}
                                />
                            </>
                        )}

                        {/* Incident markers */}
                        {incidents.map((incident) => {
                            const icon = SEVERITY_ICON[incident.severity] ?? SEVERITY_ICON.MEDIUM;
                            const pos: [number, number] = [incident.location.latitude, incident.location.longitude];
                            const label = SEVERITY_LABEL[incident.severity] ?? SEVERITY_LABEL.MEDIUM;

                            return (
                                <Marker key={incident.id} position={pos} icon={icon}>
                                    <Popup minWidth={220}>
                                        <div className="space-y-1.5 py-1">
                                            {/* Header row */}
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${label.bg} ${label.text}`}>
                                                    {incident.severity}
                                                </span>
                                                <span className="text-xs text-gray-500">{incident.status}</span>
                                            </div>

                                            <p className="font-bold text-gray-900 text-sm">{incident.type}</p>
                                            <p className="text-xs text-gray-600 leading-snug">{incident.description}</p>

                                            {incident.location.address && (
                                                <p className="text-xs text-gray-500 flex items-start gap-1">
                                                    <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                                                    {incident.location.address}
                                                </p>
                                            )}

                                            <p className="text-xs text-gray-400">{formatTime(incident.createdAt)}</p>

                                            {/* View Details button */}
                                            <button
                                                onClick={() => navigate(`/volunteer/incident/${incident.id}`)}
                                                className="mt-1 w-full py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors"
                                            >
                                                View Details →
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                )}

                {/* ── Map Legend ── */}
                <div className="absolute bottom-5 left-3 z-[1000] bg-white rounded-2xl shadow-lg px-4 py-3 text-xs space-y-1.5">
                    <p className="font-bold text-gray-700 mb-1">Legend</p>
                    {[
                        { color: 'bg-red-500', label: 'Critical' },
                        { color: 'bg-orange-500', label: 'High' },
                        { color: 'bg-yellow-400', label: 'Medium' },
                        { color: 'bg-blue-500', label: 'Low' },
                        { color: 'bg-green-500', label: 'Your Location' },
                    ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${color} shrink-0`} />
                            <span className="text-gray-600">{label}</span>
                        </div>
                    ))}
                </div>

                {/* ── No incidents notice ── */}
                {!loading && incidents.length === 0 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-2xl shadow-lg px-5 py-3 flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700 font-medium">No active incidents nearby</span>
                    </div>
                )}
            </div>

            <VolunteerBottomNav inline />
        </div>
    );
}
