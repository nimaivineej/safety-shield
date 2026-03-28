import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MapPin,
    RefreshCw,
    Users,
    AlertCircle,
    Search,
    Navigation,
    ArrowRight,
    ArrowUp,
    CornerDownLeft,
    CornerDownRight,
    CheckCircle2,
    X,
    Clock,
    Locate,
    Hospital,
    ShieldCheck,
    Building2,
    Car,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { volunteerService, Incident } from '../../services/volunteer.service';
import { VolunteerBottomNav } from './VolunteerBottomNav';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { useMap, Polyline } from 'react-leaflet';
import { Geolocation } from '@capacitor/geolocation';

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

const SERVICE_ICONS: Record<string, L.Icon> = {
    HOSPITAL: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    }),
    POLICE_STATION: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    }),
    INSURANCE_AGENT: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    }),
    AMBULANCE: new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
    }),
};

interface Service {
    id: string; type: string; name: string; phone: string;
    latitude?: number; longitude?: number; address?: string;
}

function formatTime(dateString: string) {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
}

interface NavStep {
    instruction: string;
    distance: number;
    maneuver: string;
    location: [number, number];
}

function parseInstruction(step: any): string {
    const type = step.maneuver?.type ?? '';
    const modifier = step.maneuver?.modifier ?? '';
    const name = step.name ? ` on ${step.name}` : '';

    if (type === 'depart') return `Start heading ${modifier}${name}`;
    if (type === 'arrive') return `You have arrived at your destination`;
    if (type === 'turn') {
        if (modifier === 'left') return `Turn left${name}`;
        if (modifier === 'right') return `Turn right${name}`;
        if (modifier === 'slight left') return `Keep slight left${name}`;
        if (modifier === 'slight right') return `Keep slight right${name}`;
        if (modifier === 'straight') return `Continue straight${name}`;
    }
    return `Continue${name}`;
}

function ManeuverIcon({ maneuver }: { maneuver: string }) {
    const cls = 'w-8 h-8 text-white';
    if (maneuver.includes('left')) return <CornerDownLeft className={cls} />;
    if (maneuver.includes('right')) return <CornerDownRight className={cls} />;
    if (maneuver === 'arrive') return <CheckCircle2 className={cls} />;
    return <ArrowUp className={cls} />;
}

function formatStepDist(metres: number) {
    if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
    return `${Math.round(metres)} m`;
}

function MapController({ follow, center, routeCoords }: { follow: boolean; center: [number, number]; routeCoords: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (follow) {
            map.setView(center, 17, { animate: true });
        }
    }, [center, follow, map]);

    useEffect(() => {
        if (!follow && routeCoords.length > 0) {
            const bounds = L.latLngBounds(routeCoords);
            map.fitBounds(bounds, { padding: [40, 40] });
        }
    }, [routeCoords, follow, map]);
    return null;
}

export function VolunteerMapScreen() {
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [volunteerLocation, setVolunteerLocation] = useState<[number, number] | null>(null);

    // Search state
    const [destination, setDestination] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Nearby services state
    const [services, setServices] = useState<Service[]>([]);
    const [activeServiceFilter, setActiveServiceFilter] = useState<string | null>(null);

    // Destination state
    const [destLocation, setDestLocation] = useState<[number, number] | null>(null);
    const [destName, setDestName] = useState('');

    // Navigation state
    const [isNavigating, setIsNavigating] = useState(false);
    const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
    const [remainingCoords, setRemainingCoords] = useState<[number, number][]>([]);
    const [navSteps, setNavSteps] = useState<NavStep[]>([]);
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [remainingDist, setRemainingDist] = useState('');
    const [targetIncident, setTargetIncident] = useState<Incident | null>(null);
    const [routeLoading, setRouteLoading] = useState(false);
    const watchIdRef = useRef<string | null>(null);

    // Default centre: New Delhi (fallback if geolocation fails)
    const defaultCenter: [number, number] = [28.6139, 77.209];

    useEffect(() => {
        loadIncidents();
        getLocation();
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await volunteerService.getNearbyServices(); // Assuming this exists or using generic api
            setServices(res.data || []);
        } catch (e) {
            console.error('Failed to load services:', e);
        }
    };

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

    const getLocation = async () => {
        try {
            const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
            setVolunteerLocation([pos.coords.latitude, pos.coords.longitude]);
        } catch (e) {
            console.error('Location error:', e);
            setVolunteerLocation(defaultCenter);
            toast.error('Could not get your precise location. Using default.');
        }
    };

    const searchDestination = (query: string) => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (!query.trim() || query.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
        searchDebounceRef.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
                const data = await res.json();
                setSuggestions(data); setShowSuggestions(true);
            } catch { setSuggestions([]); }
            finally { setSearchLoading(false); }
        }, 400);
    };

    const handleSelectSuggestion = async (result: any) => {
        const lat = parseFloat(result.lat); const lng = parseFloat(result.lon);
        setDestination(result.display_name.split(',')[0]);
        setDestName(result.display_name.split(',')[0]);
        setDestLocation([lat, lng]);
        setShowSuggestions(false);
        const incidentStub: any = { type: 'Destination', location: { latitude: lat, longitude: lng } };
        setTargetIncident(incidentStub);
        await fetchRoute(lat, lng);
    };

    const fetchRoute = async (destLat: number, destLng: number) => {
        if (!volunteerLocation) {
            toast.error('Your location is not available.');
            return;
        }
        setRouteLoading(true);
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${volunteerLocation[1]},${volunteerLocation[0]};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.code !== 'Ok' || !data.routes?.length) {
                toast.error('Could not find a route.');
                return;
            }
            const route = data.routes[0];
            const coords: [number, number][] = route.geometry.coordinates.map(
                ([lng, lat]: [number, number]) => [lat, lng]
            );
            setRouteCoords(coords);
            setRemainingCoords(coords);

            const steps: NavStep[] = [];
            for (const leg of route.legs) {
                for (const step of leg.steps) {
                    steps.push({
                        instruction: parseInstruction(step),
                        distance: step.distance,
                        maneuver: `${step.maneuver?.type ?? 'straight'}-${step.maneuver?.modifier ?? 'straight'}`,
                        location: [step.maneuver.location[1], step.maneuver.location[0]],
                    });
                }
            }
            setNavSteps(steps);
            setRemainingDist(`${(route.distance / 1000).toFixed(1)} km`);
        } catch {
            toast.error('Failed to fetch route.');
        } finally {
            setRouteLoading(false);
        }
    };

    const handleRecenter = async () => {
        try {
            const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
            const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setVolunteerLocation(loc);
            toast.success('Location updated');
        } catch {
            toast.error('Could not get current location');
        }
    };

    const calcDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const startNavigation = async (incident: Incident) => {
        setTargetIncident(incident);
        setIsNavigating(true);
        setCurrentStepIdx(0);

        try {
            const watchId = await Geolocation.watchPosition(
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
                (pos, err) => {
                    if (err) {
                        console.error('Watch error:', err);
                        toast.error(`Navigation tracking error: ${err.message}`);
                        return;
                    }
                    if (!pos) return;

                    const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                    setVolunteerLocation(loc);

                    const distToDest = calcDist(loc[0], loc[1], incident.location.latitude, incident.location.longitude);
                    if (distToDest < 30) {
                        toast.success("You've arrived!");
                        stopNavigation();
                        return;
                    }

                    setCurrentStepIdx((prev) => {
                        let idx = prev;
                        while (idx < navSteps.length - 1) {
                            const nextStep = navSteps[idx + 1];
                            const d = calcDist(loc[0], loc[1], nextStep.location[0], nextStep.location[1]);
                            if (d < 25) { idx += 1; } else { break; }
                        }
                        return idx;
                    });

                    setRemainingDist(distToDest >= 1000 ? `${(distToDest / 1000).toFixed(1)} km` : `${Math.round(distToDest)} m`);
                }
            );
            watchIdRef.current = watchId;
        } catch (e: any) {
            toast.error(`Failed to start tracking: ${e?.message || 'Unknown error'}`);
            setIsNavigating(false);
        }
    };

    const stopNavigation = () => {
        if (watchIdRef.current !== null) {
            Geolocation.clearWatch({ id: watchIdRef.current });
            watchIdRef.current = null;
        }
        setIsNavigating(false);
        setRouteCoords([]);
        setNavSteps([]);
        setTargetIncident(null);
        setDestLocation(null);
        setDestName('');
    };

    useEffect(() => {
        return () => { if (watchIdRef.current !== null) Geolocation.clearWatch({ id: watchIdRef.current }); };
    }, []);

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
                             <h1 className="text-lg font-bold text-gray-900">Volunteer Map</h1>
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
 
             {/* ── Search Bar Section ── */}
             {!isNavigating && (
                 <div className="bg-white px-4 py-3 border-b border-gray-100 z-[1001]">
                     <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                         <input
                             type="text"
                             value={destination}
                             onChange={(e) => { setDestination(e.target.value); searchDestination(e.target.value); }}
                             placeholder="Search destination to navigate..."
                             className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:bg-white transition-all shadow-sm"
                         />
                         {showSuggestions && suggestions.length > 0 && (
                             <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl z-[2000] overflow-hidden border border-gray-100 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1">
                                 {suggestions.map((s: any) => (
                                     <button key={s.place_id} onClick={() => handleSelectSuggestion(s)}
                                         className="w-full text-left px-4 py-3 text-xs text-gray-700 hover:bg-green-50 border-b last:border-b-0 border-gray-50 uppercase font-medium">
                                         {s.display_name}
                                     </button>
                                 ))}
                             </div>
                         )}
                     </div>
                 </div>
             )}

            {/* ── Map ── */}
            <div className={`${isNavigating ? 'flex-1' : 'h-1/2'} relative min-h-0 border-b border-gray-200 shadow-inner`}>
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
                        <MapController follow={isNavigating} center={volunteerLocation ?? defaultCenter} routeCoords={routeCoords} />

                        {/* Full route */}
                        {routeCoords.length > 0 && (
                            <Polyline positions={routeCoords}
                                pathOptions={{ color: isNavigating ? '#d1d5db' : '#16a34a', weight: 5, opacity: 0.6 }} />
                        )}
                        {/* Remaining route */}
                        {isNavigating && remainingCoords.length > 0 && (
                            <Polyline positions={remainingCoords}
                                pathOptions={{ color: '#16a34a', weight: 6, opacity: 1 }} />
                        )}

                        {/* 🚩 Destination Marker */}
                        {destLocation && (
                            <Marker position={destLocation}>
                                <Popup>
                                    <div className="text-center">
                                        <strong className="text-green-700">Destination</strong>
                                        <p className="text-xs text-gray-500">{destName}</p>
                                        <button
                                            onClick={() => startNavigation(targetIncident!)}
                                            className="mt-2 w-full py-1 text-xs bg-green-600 text-white rounded-lg font-bold"
                                        >
                                            Start Navigation
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* 🏥 Services Markers */}
                        {services.filter(s => s.latitude && s.longitude && (!activeServiceFilter || s.type === activeServiceFilter)).map((svc) => (
                            <Marker key={svc.id} position={[svc.latitude!, svc.longitude!]} icon={SERVICE_ICONS[svc.type] || SEVERITY_ICON.MEDIUM}>
                                <Popup>
                                    <div className="min-w-[140px]">
                                        <p className="font-bold text-sm text-gray-900">{svc.name}</p>
                                        <p className="text-xs text-gray-500 mb-1 capitalize">{svc.type.replace('_', ' ')}</p>
                                        {svc.address && <p className="text-xs text-gray-600 mb-1">{svc.address}</p>}
                                        <div className="flex gap-2 mt-2">
                                            <a href={`tel:${svc.phone}`} className="flex-1 py-1 bg-purple-600 text-white text-center text-[10px] rounded-lg font-bold uppercase tracking-wider">Call</a>
                                            <button
                                                onClick={async () => {
                                                    setDestLocation([svc.latitude!, svc.longitude!]);
                                                    setDestName(svc.name);
                                                    setDestination(svc.name);
                                                    const stub: any = { type: svc.type, location: { latitude: svc.latitude!, longitude: svc.longitude! } };
                                                    setTargetIncident(stub);
                                                    await fetchRoute(svc.latitude!, svc.longitude!);
                                                }}
                                                className="flex-1 py-1 bg-blue-600 text-white text-[10px] rounded-lg font-bold uppercase tracking-wider flex items-center justify-center gap-1"
                                            >
                                                <Navigation className="w-2.5 h-2.5" /> Go
                                            </button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

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

                                            {/* Navigate button */}
                                            {!isNavigating && (
                                                <button
                                                    onClick={async () => {
                                                        await fetchRoute(incident.location.latitude, incident.location.longitude);
                                                        startNavigation(incident);
                                                    }}
                                                    className="mt-2 w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Navigation className="w-3.5 h-3.5" />
                                                    Navigate
                                                </button>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                )}

                {/* ── Navigation Overlay ── */}
                {isNavigating && (
                    <div className="absolute inset-x-0 top-0 z-[1001] flex flex-col pointer-events-none">
                        {/* Instruction panel */}
                        <div className="bg-gradient-to-r from-green-700 to-teal-600 text-white p-5 flex items-center gap-4 shadow-xl pointer-events-auto">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                {navSteps[currentStepIdx] && <ManeuverIcon maneuver={navSteps[currentStepIdx].maneuver} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xl font-bold leading-tight">
                                    {navSteps[currentStepIdx]?.instruction ?? 'Follow the route'}
                                </p>
                                {navSteps[currentStepIdx] && navSteps[currentStepIdx].distance > 0 && (
                                    <p className="text-green-100 text-sm mt-0.5">
                                        In {formatStepDist(navSteps[currentStepIdx].distance)}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={stopNavigation}
                                className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {isNavigating && (
                    <div className="absolute inset-x-0 bottom-0 z-[1001] bg-gray-900 border-t border-gray-800 text-white px-5 py-4 flex items-center justify-between pointer-events-auto">
                        <div>
                            <p className="text-2xl font-bold text-green-400">{remainingDist}</p>
                            <p className="text-gray-400 text-xs">remaining</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold truncate max-w-[150px]">
                                {targetIncident?.type ?? 'Incident'}
                            </p>
                            <p className="text-gray-400 text-xs">Destination</p>
                        </div>
                        <button
                            onClick={stopNavigation}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
                        >
                            Exit
                        </button>
                    </div>
                )}

                {/* ── Loading Route Overlay ── */}
                {routeLoading && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[1002] flex items-center justify-center">
                        <div className="bg-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3">
                            <RefreshCw className="w-5 h-5 text-green-600 animate-spin" />
                            <span className="font-semibold text-gray-800">Calculating route…</span>
                        </div>
                    </div>
                )}

                {/* ── No incidents notice ── */}
                {!loading && incidents.length === 0 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white rounded-2xl shadow-lg px-5 py-3 flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700 font-medium">No active incidents nearby</span>
                    </div>
                )}

                {/* 🎯 Re-center button */}
                {!isNavigating && (
                    <button
                        onClick={handleRecenter}
                        className="absolute bottom-4 right-4 z-[1000] p-3 bg-white rounded-full shadow-lg border border-gray-100 text-green-600 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        <Locate className="w-6 h-6" />
                    </button>
                )}

                {/* 🚀 Start Navigation Button (Prominent) */}
                {routeCoords.length > 0 && !isNavigating && targetIncident && (
                    <div className="absolute inset-x-0 bottom-4 z-[1001] flex justify-center pointer-events-none">
                        <button
                            onClick={() => startNavigation(targetIncident!)}
                            className="pointer-events-auto bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-4 rounded-2xl shadow-[0_10px_40px_rgba(22,163,74,0.4)] flex items-center gap-3 transform transition-all active:scale-95 ring-4 ring-white"
                        >
                            <Navigation className="w-6 h-6 fill-white" />
                            <span className="text-lg">Start Navigation</span>
                        </button>
                    </div>
                )}
            </div>

            {/* ── Incident List (Bottom Half) ── */}
            {!isNavigating && (
                <div className="flex-1 overflow-y-auto bg-gray-50">
                     <div className="px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
                         <div className="flex items-center justify-between mb-3">
                             <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                 <AlertCircle className="w-4 h-4 text-green-600" />
                                 Nearby Incidents ({incidents.length})
                             </h2>
                             <span className="text-xs text-gray-400">Scroll for more</span>
                         </div>
                         
                         {/* Service filters */}
                         <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                             <button onClick={() => setActiveServiceFilter(null)}
                                 className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${!activeServiceFilter ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-500 border-gray-200'}`}>
                                 All Incidents
                             </button>
                             <button onClick={() => setActiveServiceFilter('POLICE_STATION')}
                                 className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1.5 ${activeServiceFilter === 'POLICE_STATION' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                 <ShieldCheck className="w-3 h-3" /> Police
                             </button>
                             <button onClick={() => setActiveServiceFilter('HOSPITAL')}
                                 className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1.5 ${activeServiceFilter === 'HOSPITAL' ? 'bg-red-600 text-white border-red-600' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                 <Hospital className="w-3 h-3" /> Hospital
                             </button>
                             <button onClick={() => setActiveServiceFilter('AMBULANCE')}
                                 className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border flex items-center gap-1.5 ${activeServiceFilter === 'AMBULANCE' ? 'bg-orange-600 text-white border-orange-600' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                 <Car className="w-3 h-3" /> Ambulance
                             </button>
                         </div>
                     </div>

                    <div className="divide-y divide-gray-100">
                        {incidents.length === 0 && !loading ? (
                            <div className="py-20 text-center">
                                <AlertCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-gray-400 text-sm">No incidents found in your area.</p>
                            </div>
                        ) : (
                            incidents.map((incident) => {
                                const label = SEVERITY_LABEL[incident.severity] ?? SEVERITY_LABEL.MEDIUM;
                                return (
                                    <div key={incident.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${label.bg} ${label.text}`}>
                                                    {incident.severity}
                                                </span>
                                                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                                                    {incident.status}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium">
                                                {formatTime(incident.createdAt)}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-gray-900 text-sm mb-1">{incident.type}</h3>
                                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-3">
                                            {incident.description}
                                        </p>

                                        {incident.location.address && (
                                            <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-4">
                                                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
                                                <span className="line-clamp-1">{incident.location.address}</span>
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate(`/volunteer/incident/${incident.id}`)}
                                                className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
                                            >
                                                Details
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    await fetchRoute(incident.location.latitude, incident.location.longitude);
                                                    startNavigation(incident);
                                                }}
                                                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                                            >
                                                <Navigation className="w-3.5 h-3.5" />
                                                Navigate
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            <VolunteerBottomNav inline />
        </div>
    );
}
