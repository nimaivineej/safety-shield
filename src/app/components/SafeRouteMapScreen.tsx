import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, AlertTriangle, Shield, Navigation,
  Search, Locate, Loader, Hospital, ShieldCheck, Building2, Car, X, Clock, Route,
  ArrowRight, ArrowUp, CornerDownLeft, CornerDownRight, CheckCircle2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BottomNav } from './BottomNav';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { locationService, SafeZone, RiskZone } from '../../services/location.service';
import { incidentService, IncidentReport } from '../../services/incident.service';
import { toast } from 'sonner';
import api from '../../services/api';

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

const circleIcon = (color: string) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color:${color};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
  });

const emojiIcon = (emoji: string, bg: string) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${bg};width:34px;height:34px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:16px;">${emoji}</div>`,
    iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18],
  });

const navArrowIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background:linear-gradient(135deg,#7c3aed,#2563eb);width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
  </div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});

const destinationIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background:linear-gradient(135deg,#7c3aed,#2563eb);width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);"></div>`,
  iconSize: [36, 36], iconAnchor: [18, 36], popupAnchor: [0, -36],
});

const safeZoneIcon = circleIcon('#22c55e');
const cautionZoneIcon = circleIcon('#eab308');
const riskZoneIcon = circleIcon('#ef4444');
const userLocationIcon = circleIcon('#3b82f6');
const unsafeIncidentIcon = emojiIcon('⚠️', '#000000');

const SERVICE_ICONS: Record<string, ReturnType<typeof emojiIcon>> = {
  HOSPITAL: emojiIcon('🏥', '#ef4444'),
  POLICE_STATION: emojiIcon('🚔', '#3b82f6'),
  INSURANCE_AGENT: emojiIcon('🏢', '#8b5cf6'),
  AMBULANCE: emojiIcon('🚑', '#f97316'),
};

const SERVICE_LABELS: Record<string, { label: string; color: string }> = {
  HOSPITAL: { label: 'Hospital', color: 'text-red-600' },
  POLICE_STATION: { label: 'Police Station', color: 'text-blue-600' },
  INSURANCE_AGENT: { label: 'Insurance Agent', color: 'text-purple-600' },
  AMBULANCE: { label: 'Ambulance', color: 'text-orange-500' },
};

interface Service {
  id: string; type: string; name: string; phone: string;
  email?: string; latitude?: number; longitude?: number; address?: string;
}

interface NominatimResult {
  place_id: number; display_name: string; lat: string; lon: string;
}

interface RouteInfo {
  distance: string; duration: string;
}

interface NavStep {
  instruction: string;
  distance: number; // metres to next step
  maneuver: string; // 'turn-left' | 'turn-right' | 'straight' | etc.
  location: [number, number];
}

// OSRM maneuver type → readable label
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
    if (modifier === 'sharp left') return `Take sharp left${name}`;
    if (modifier === 'sharp right') return `Take sharp right${name}`;
    if (modifier === 'straight') return `Continue straight${name}`;
    if (modifier === 'uturn') return `Make a U-turn${name}`;
  }
  if (type === 'new name') return `Continue${name}`;
  if (type === 'merge') return `Merge ${modifier}${name}`;
  if (type === 'ramp') return `Take the ramp ${modifier}${name}`;
  if (type === 'fork') return `Keep ${modifier} at the fork${name}`;
  if (type === 'end of road') return `Turn ${modifier} at the end of road${name}`;
  if (type === 'roundabout') return `Enter roundabout${name}`;
  if (type === 'exit roundabout') return `Exit roundabout${name}`;
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

// ── Map controller ────────────────────────────────────────────────────────
function MapController({ follow, center, routeCoords, userLocation, destLocation }: {
  follow: boolean; center: [number, number];
  routeCoords: [number, number][];
  userLocation: [number, number];
  destLocation: [number, number] | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (follow) {
      map.setView(center, 17, { animate: true });
    }
  }, [center, follow, map]);

  useEffect(() => {
    if (!follow && routeCoords.length > 0 && destLocation) {
      const bounds = L.latLngBounds([userLocation, destLocation, ...routeCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routeCoords, destLocation, follow, map, userLocation]);
  return null;
}

// ── Inner Map Component ───────────────────────────────────────────────────
function SafeRouteMap({
  userLocation, safeZones, riskZones, services, unsafeIncidents,
  routeCoords, remainingCoords, destLocation, destName, isNavigating
}: {
  userLocation: [number, number]; safeZones: SafeZone[]; riskZones: RiskZone[];
  services: Service[]; unsafeIncidents: IncidentReport[];
  routeCoords: [number, number][]; remainingCoords: [number, number][];
  destLocation: [number, number] | null; destName: string; isNavigating: boolean;
}) {
  return (
    <MapContainer center={userLocation} zoom={13} style={{ height: '100%', width: '100%' }} className="z-0 rounded-3xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController
        follow={isNavigating} center={userLocation}
        routeCoords={routeCoords} userLocation={userLocation} destLocation={destLocation}
      />

      {/* Full route (grey when navigating) */}
      {routeCoords.length > 0 && (
        <Polyline positions={routeCoords}
          pathOptions={{ color: isNavigating ? '#d1d5db' : '#7c3aed', weight: 5, opacity: 0.6 }} />
      )}
      {/* Remaining route (purple, bold) */}
      {isNavigating && remainingCoords.length > 0 && (
        <Polyline positions={remainingCoords}
          pathOptions={{ color: '#7c3aed', weight: 6, opacity: 1 }} />
      )}

      <Marker position={userLocation} icon={isNavigating ? navArrowIcon : userLocationIcon}>
        <Popup><div className="text-center"><strong>Your Location</strong></div></Popup>
      </Marker>

      {destLocation && (
        <Marker position={destLocation} icon={destinationIcon}>
          <Popup><div className="text-center"><strong className="text-purple-700">Destination</strong><p className="text-sm text-gray-600 max-w-[160px]">{destName}</p></div></Popup>
        </Marker>
      )}

      {!isNavigating && safeZones.map((zone) => (
        <span key={`safe-${zone.id}`}>
          <Marker position={[zone.latitude, zone.longitude]} icon={safeZoneIcon}>
            <Popup><div className="text-center"><strong className="text-green-700">{zone.name}</strong><p className="text-xs text-green-600 font-semibold">Safe Zone</p></div></Popup>
          </Marker>
          <Circle center={[zone.latitude, zone.longitude]} radius={zone.radius}
            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2 }} />
        </span>
      ))}

      {!isNavigating && riskZones.map((zone) => (
        <span key={`risk-${zone.id}`}>
          <Marker position={[zone.latitude, zone.longitude]} icon={zone.riskLevel === 'HIGH' ? riskZoneIcon : cautionZoneIcon}>
            <Popup><div className="text-center"><strong>{zone.name}</strong></div></Popup>
          </Marker>
          <Circle center={[zone.latitude, zone.longitude]} radius={zone.radius}
            pathOptions={{ color: zone.riskLevel === 'HIGH' ? '#ef4444' : '#eab308', fillColor: zone.riskLevel === 'HIGH' ? '#ef4444' : '#eab308', fillOpacity: 0.2 }} />
        </span>
      ))}

      {!isNavigating && unsafeIncidents.map((inc) => {
        if (!inc.location) return null;
        return (
          <span key={`incident-${inc.id}`}>
            <Marker position={[inc.location.latitude, inc.location.longitude]} icon={unsafeIncidentIcon}>
              <Popup><div className="text-center w-40"><strong className="text-black uppercase text-sm">{inc.type}</strong></div></Popup>
            </Marker>
            <Circle center={[inc.location.latitude, inc.location.longitude]} radius={1000}
              pathOptions={{ color: '#000000', fillColor: '#000000', fillOpacity: 0.15, dashArray: '4 4' }} />
          </span>
        );
      })}

      {!isNavigating && services.filter(s => s.latitude && s.longitude).map((svc) => {
        const icon = SERVICE_ICONS[svc.type] ?? SERVICE_ICONS['HOSPITAL'];
        const meta = SERVICE_LABELS[svc.type];
        return (
          <Marker key={svc.id} position={[svc.latitude!, svc.longitude!]} icon={icon}>
            <Popup>
              <div style={{ minWidth: 140 }}>
                <p className={`font-semibold text-sm ${meta?.color ?? 'text-gray-800'}`}>{svc.name}</p>
                <p className="text-xs text-gray-500 mb-1">{meta?.label}</p>
                {svc.address && <p className="text-xs text-gray-600 mb-1">{svc.address}</p>}
                <a href={`tel:${svc.phone}`} className="text-xs text-blue-600 font-medium hover:underline block">📞 {svc.phone}</a>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

// ── Screen Component ────────────────────────────────────────────────────────
export function SafeRouteMapScreen() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState('');
  const [userLocation, setUserLocation] = useState<[number, number]>([28.6139, 77.2090]);
  const [showWarning, setShowWarning] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [safeZones, setSafeZones] = useState<SafeZone[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [unsafeIncidents, setUnsafeIncidents] = useState<IncidentReport[]>([]);
  const notifiedZonesRef = useRef<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Search / route
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [destLocation, setDestLocation] = useState<[number, number] | null>(null);
  const [destName, setDestName] = useState('');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // In-app navigation
  const [isNavigating, setIsNavigating] = useState(false);
  const [navSteps, setNavSteps] = useState<NavStep[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [remainingCoords, setRemainingCoords] = useState<[number, number][]>([]);
  const [remainingDist, setRemainingDist] = useState('');
  const [arrived, setArrived] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLocation(loc);
          fetchData(loc[0], loc[1]);
        },
        () => fetchData(28.6139, 77.2090)
      );
    } else { fetchData(28.6139, 77.2090); }
    const t = setTimeout(() => setMapReady(true), 100);
    return () => clearTimeout(t);
  }, []);

  const fetchData = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const [safe, risk, svcRes, incidentsRes] = await Promise.all([
        locationService.getSafeZones(lat, lng).catch(() => []),
        locationService.getRiskZones(lat, lng).catch(() => []),
        api.get('/services').catch(() => ({ data: { data: [] } })),
        incidentService.getIncidents().catch(() => []),
      ]);
      setSafeZones(safe);
      setRiskZones(risk);
      setServices(svcRes.data?.data ?? []);
      const targetIncidents = incidentsRes.filter((inc) =>
        (inc.type === 'THEFT' || inc.type === 'HARASSMENT') && inc.location?.latitude && inc.location?.longitude
      );
      setUnsafeIncidents(targetIncidents);
      if (risk.length > 0 || targetIncidents.length > 0) setShowWarning(true);
    } catch (err) { console.error('Failed to fetch map data:', err); }
    finally { setLoading(false); }
  };

  // Nominatim autocomplete
  const searchDestination = useCallback((query: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!query.trim() || query.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data); setShowSuggestions(true);
      } catch { setSuggestions([]); }
      finally { setSearchLoading(false); }
    }, 400);
  }, []);

  const handleDestinationChange = (val: string) => {
    setDestination(val);
    if (!val) { clearRoute(); return; }
    searchDestination(val);
  };

  // OSRM route fetch with steps
  const fetchRoute = async (destLat: number, destLng: number) => {
    setRouteLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${destLng},${destLat}?overview=full&geometries=geojson&steps=true&annotations=false`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.length) {
        toast.error('Could not find a route to this destination.'); return;
      }
      const route = data.routes[0];
      const coords: [number, number][] = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      setRouteCoords(coords);
      setRemainingCoords(coords);

      // Parse steps
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

      const distKm = (route.distance / 1000).toFixed(1);
      const mins = Math.round(route.duration / 60);
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      setRouteInfo({
        distance: `${distKm} km`,
        duration: hours > 0 ? `${hours}h ${remMins}m` : `${mins} min`,
      });
      setRemainingDist(`${distKm} km`);
    } catch { toast.error('Failed to fetch route. Please try again.'); }
    finally { setRouteLoading(false); }
  };

  const handleSelectSuggestion = (result: NominatimResult) => {
    const lat = parseFloat(result.lat); const lng = parseFloat(result.lon);
    setDestination(result.display_name.split(',').slice(0, 2).join(','));
    setDestLocation([lat, lng]); setDestName(result.display_name);
    setSuggestions([]); setShowSuggestions(false);
    fetchRoute(lat, lng);
  };

  const clearRoute = () => {
    stopNavigation();
    setRouteCoords([]); setDestLocation(null); setDestName('');
    setRouteInfo(null); setDestination('');
    setSuggestions([]); setShowSuggestions(false);
    setNavSteps([]); setCurrentStepIdx(0);
  };

  // Distance helper
  const calcDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180; const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180; const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Start in-app navigation
  const startNavigation = () => {
    if (!destLocation || navSteps.length === 0) return;
    setIsNavigating(true); setArrived(false); setCurrentStepIdx(0);
    setRemainingCoords([...routeCoords]);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);

        // Check arrival
        const distToDest = calcDist(loc[0], loc[1], destLocation[0], destLocation[1]);
        if (distToDest < 30) {
          setArrived(true); stopNavigation(); return;
        }

        // Advance steps
        setCurrentStepIdx((prev) => {
          let idx = prev;
          while (idx < navSteps.length - 1) {
            const nextStep = navSteps[idx + 1];
            const d = calcDist(loc[0], loc[1], nextStep.location[0], nextStep.location[1]);
            if (d < 25) { idx += 1; } else { break; }
          }
          return idx;
        });

        // Remaining distance to destination
        const rem = calcDist(loc[0], loc[1], destLocation[0], destLocation[1]);
        setRemainingDist(rem >= 1000 ? `${(rem / 1000).toFixed(1)} km` : `${Math.round(rem)} m`);

        // Trim remaining coords to closest point
        setRemainingCoords((prev) => {
          if (prev.length < 2) return prev;
          let closest = 0; let minD = Infinity;
          prev.forEach((pt, i) => {
            const d = calcDist(loc[0], loc[1], pt[0], pt[1]);
            if (d < minD) { minD = d; closest = i; }
          });
          return prev.slice(closest);
        });
      },
      () => toast.error('Could not track location. Enable GPS.'),
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
  };

  const stopNavigation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsNavigating(false);
  };

  useEffect(() => {
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  useEffect(() => {
    if (unsafeIncidents.length === 0) return;
    unsafeIncidents.forEach((incident) => {
      if (!incident.location) return;
      const d = calcDist(userLocation[0], userLocation[1], incident.location.latitude, incident.location.longitude);
      if (d <= 1000 && !notifiedZonesRef.current.has(incident.id)) {
        notifiedZonesRef.current.add(incident.id);
        toast.error(`⚠️ Unsafe Area Nearby!`, {
          description: `Within 1km of a ${incident.type.toLowerCase()} incident. Stay alert.`,
          duration: 10000, position: 'top-center',
        });
      }
    });
  }, [userLocation, unsafeIncidents]);

  const handleRecenter = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => { const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]; setUserLocation(loc); fetchData(loc[0], loc[1]); },
      () => alert('Could not get your location.')
    );
  };

  const visibleServices = activeFilter ? services.filter(s => s.type === activeFilter) : services;
  const serviceGroups = [
    { type: 'HOSPITAL', label: 'Hospitals', icon: Hospital, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    { type: 'POLICE_STATION', label: 'Police', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { type: 'INSURANCE_AGENT', label: 'Insurance', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    { type: 'AMBULANCE', label: 'Ambulance', icon: Car, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  ] as const;

  const currentStep = navSteps[currentStepIdx];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-20">

      {/* ── Navigation Overlay (full screen when active) ── */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
          {/* Current instruction panel */}
          <div className="bg-gradient-to-r from-purple-700 to-blue-600 text-white p-5 flex items-center gap-4 shadow-xl">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              {currentStep && <ManeuverIcon maneuver={currentStep.maneuver} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold leading-tight">{currentStep?.instruction ?? 'Follow the route'}</p>
              {currentStep && currentStep.distance > 0 && (
                <p className="text-purple-200 text-sm mt-0.5">In {formatStepDist(currentStep.distance)}</p>
              )}
            </div>
            <button onClick={stopNavigation} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            {mapReady && (
              <SafeRouteMap
                userLocation={userLocation} safeZones={[]} riskZones={[]}
                services={[]} unsafeIncidents={[]}
                routeCoords={routeCoords} remainingCoords={remainingCoords}
                destLocation={destLocation} destName={destName} isNavigating={true}
              />
            )}
          </div>

          {/* Bottom info bar */}
          <div className="bg-gray-900 text-white px-5 py-4 flex items-center justify-between safe-area-bottom">
            <div>
              <p className="text-2xl font-bold">{remainingDist}</p>
              <p className="text-gray-400 text-sm">remaining</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{destName.split(',')[0]}</p>
              <p className="text-gray-400 text-sm">Destination</p>
            </div>
            <button onClick={stopNavigation}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl text-sm">
              End
            </button>
          </div>
        </div>
      )}

      {/* ── Arrival Modal ── */}
      {arrived && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-3xl p-8 mx-6 text-center shadow-2xl">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You've Arrived!</h2>
            <p className="text-gray-500 mb-6">{destName.split(',').slice(0, 2).join(',')}</p>
            <Button className="w-full h-12 rounded-2xl bg-purple-600 hover:bg-purple-700" onClick={() => { setArrived(false); clearRoute(); }}>
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate('/home')} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Safe Route Map</h1>
            <p className="text-purple-100">Find the safest path</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
          <Input
            type="text" value={destination}
            onChange={(e) => handleDestinationChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Enter destination..."
            className="pl-12 pr-10 h-12 rounded-2xl bg-white text-gray-900"
          />
          {searchLoading && <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
          {destination && !searchLoading && (
            <button onClick={clearRoute} className="absolute right-4 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl z-[9999] overflow-hidden border border-gray-100">
              {suggestions.map((s) => (
                <button key={s.place_id} onClick={() => handleSelectSuggestion(s)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-purple-50 border-b last:border-b-0 border-gray-50 transition-colors">
                  <MapPin className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-800 line-clamp-2">{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Route Info Card */}
        {routeInfo && !isNavigating && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Route className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-purple-100">Route to destination</p>
                  <p className="font-semibold text-sm line-clamp-1">{destName.split(',').slice(0, 2).join(',')}</p>
                </div>
              </div>
              <button onClick={clearRoute} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-4 mt-3 pt-3 border-t border-white/20">
              <div className="flex items-center gap-1.5"><Navigation className="w-4 h-4 text-purple-200" /><span className="font-bold">{routeInfo.distance}</span></div>
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-purple-200" /><span className="font-bold">{routeInfo.duration}</span></div>
              <span className="text-xs text-purple-200 self-center">by car</span>
            </div>
          </div>
        )}

        {/* Turn-by-turn steps preview */}
        {navSteps.length > 0 && !isNavigating && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <Route className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-gray-700 text-sm">Turn-by-Turn Directions</span>
            </div>
            <div className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
              {navSteps.slice(0, -1).map((step, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="w-7 h-7 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <ManeuverIcon maneuver={step.maneuver} />
                  </div>
                  <p className="text-sm text-gray-700 flex-1">{step.instruction}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatStepDist(step.distance)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service type filter pills */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeFilter === null ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}>All</button>
          {serviceGroups.map(g => {
            const count = services.filter(s => s.type === g.type).length;
            return (
              <button key={g.type} onClick={() => setActiveFilter(activeFilter === g.type ? null : g.type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeFilter === g.type ? 'bg-purple-600 text-white border-purple-600' : `bg-white ${g.color} ${g.bg} border`}`}>
                <g.icon className="w-3.5 h-3.5" />
                {g.label} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>

        {/* Interactive Map */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="h-96 relative">
            {mapReady ? (
              <SafeRouteMap
                userLocation={userLocation} safeZones={safeZones} riskZones={riskZones}
                services={visibleServices} unsafeIncidents={unsafeIncidents}
                routeCoords={routeCoords} remainingCoords={remainingCoords}
                destLocation={destLocation} destName={destName} isNavigating={false}
              />
            ) : (
              <div className="h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <div className="text-center"><MapPin className="w-12 h-12 text-purple-600 mx-auto mb-2 animate-pulse" /><p className="text-gray-600">Loading map...</p></div>
              </div>
            )}

            <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-3 z-[1000] text-xs space-y-1">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full" /><span>You</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-600 rounded-full" /><span>Destination</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span>Safe</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full" /><span>Risk</span></div>
            </div>

            <button onClick={handleRecenter} className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl z-[1000]">
              <Locate className="w-5 h-5 text-purple-600" />
            </button>

            {routeLoading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-[1000] rounded-3xl">
                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-lg">
                  <Loader className="w-5 h-5 text-purple-600 animate-spin" />
                  <span className="text-sm font-medium text-gray-700">Finding best route...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 flex gap-2">
            {routeCoords.length > 0 ? (
              <>
                <Button
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
                  onClick={startNavigation}>
                  <Navigation className="w-5 h-5 mr-2" />
                  Start Navigation
                </Button>
                <Button variant="outline" className="h-12 px-4 rounded-xl border-gray-200" onClick={clearRoute}>
                  <X className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Button className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700" disabled={!destination}>
                <Navigation className="w-5 h-5 mr-2" />
                {destination ? 'Get Route' : 'Enter a destination above'}
              </Button>
            )}
          </div>
        </div>

        {/* Risk Zone Warning */}
        {showWarning && riskZones.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Risk Zones Detected!</h3>
                <p className="text-sm text-red-700">{riskZones.length + unsafeIncidents.length} risk zone(s) found nearby. Consider taking an alternative route.</p>
              </div>
            </div>
          </div>
        )}

        {/* Nearby Services */}
        {services.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-purple-600" />Nearby Services
              {loading && <Loader className="w-4 h-4 animate-spin text-gray-400" />}
            </h2>
            <div className="space-y-2">
              {visibleServices.map(svc => {
                const meta = SERVICE_LABELS[svc.type];
                const group = serviceGroups.find(g => g.type === svc.type);
                return (
                  <div key={svc.id} className={`bg-white rounded-2xl p-4 shadow-md border flex items-center justify-between hover:shadow-lg transition-shadow ${group?.bg ?? 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${group?.bg ?? 'bg-gray-100'}`}>
                        {svc.type === 'HOSPITAL' && '🏥'}{svc.type === 'POLICE_STATION' && '🚔'}
                        {svc.type === 'INSURANCE_AGENT' && '🏢'}{svc.type === 'AMBULANCE' && '🚑'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{svc.name}</h3>
                        <p className={`text-xs font-medium ${meta?.color ?? 'text-gray-500'}`}>{meta?.label}</p>
                        {svc.address && <p className="text-xs text-gray-400 line-clamp-1">{svc.address}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {svc.latitude && svc.longitude && (
                        <button
                          onClick={async () => {
                            setDestination(svc.name);
                            setDestLocation([svc.latitude!, svc.longitude!]);
                            setDestName(svc.name);
                            await fetchRoute(svc.latitude!, svc.longitude!);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors flex items-center gap-1">
                          <Navigation className="w-3 h-3" />Go
                        </button>
                      )}
                      <a href={`tel:${svc.phone}`} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">Call</a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Safe Zones */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600" />Nearby Safe Zones
            {loading && <Loader className="w-4 h-4 animate-spin text-gray-400" />}
          </h2>
          <div className="space-y-2">
            {safeZones.map((zone) => (
              <div key={zone.id} className="bg-white rounded-2xl p-4 shadow-md flex items-center justify-between hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                    <p className="text-sm text-gray-500">{zone.description || 'Safe area'}</p>
                  </div>
                </div>
                <Button size="sm" className="rounded-xl bg-green-600 hover:bg-green-700"
                  onClick={async () => { setDestination(zone.name); setDestLocation([zone.latitude, zone.longitude]); setDestName(zone.name); await fetchRoute(zone.latitude, zone.longitude); }}>
                  Navigate
                </Button>
              </div>
            ))}
            {!loading && safeZones.length === 0 && <p className="text-center text-gray-500 py-4">No safe zones found nearby</p>}
          </div>
        </div>

        {/* Risk Zones */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />Areas to Avoid
          </h2>
          <div className="space-y-2">
            {riskZones.map((zone) => (
              <div key={zone.id} className="bg-white rounded-2xl p-4 shadow-md flex items-center justify-between border-l-4 border-red-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${zone.riskLevel === 'HIGH' ? 'bg-red-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center`}>
                    <AlertTriangle className={`w-5 h-5 ${zone.riskLevel === 'HIGH' ? 'text-red-600' : 'text-yellow-600'}`} />
                  </div>
                  <div><h3 className="font-semibold text-gray-900">{zone.name}</h3><p className="text-sm text-gray-500">{zone.description || 'Risk area'}</p></div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${zone.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {zone.riskLevel === 'HIGH' ? 'High Risk' : 'Caution'}
                </span>
              </div>
            ))}
            {!loading && riskZones.length === 0 && <p className="text-center text-gray-500 py-4">No risk zones found nearby</p>}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
