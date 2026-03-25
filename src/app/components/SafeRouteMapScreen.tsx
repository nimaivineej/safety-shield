import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, AlertTriangle, Shield, Navigation,
  Search, Locate, Loader, Hospital, ShieldCheck, Building2, Car
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BottomNav } from './BottomNav';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { locationService, SafeZone, RiskZone } from '../../services/location.service';
import { incidentService, IncidentReport } from '../../services/incident.service';
import { toast } from 'sonner';
import api from '../../services/api';

// Fix Leaflet default marker icons
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// ── Custom marker factory ──────────────────────────────────────────────────
const circleIcon = (color: string) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color:${color};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const emojiIcon = (emoji: string, bg: string) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${bg};width:34px;height:34px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:16px;">${emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });

const safeZoneIcon = circleIcon('#22c55e');
const cautionZoneIcon = circleIcon('#eab308');
const riskZoneIcon = circleIcon('#ef4444');
const userLocationIcon = circleIcon('#3b82f6');
const unsafeIncidentIcon = emojiIcon('⚠️', '#000000');

// Service marker icons by type
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

// ── Inner Map Component ───────────────────────────────────────────────────
function SafeRouteMap({
  userLocation, safeZones, riskZones, services, unsafeIncidents
}: {
  userLocation: [number, number];
  safeZones: SafeZone[];
  riskZones: RiskZone[];
  services: Service[];
  unsafeIncidents: IncidentReport[];
}) {
  return (
    <MapContainer
      center={userLocation}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      className="z-0 rounded-3xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User Location */}
      <Marker position={userLocation} icon={userLocationIcon}>
        <Popup>
          <div className="text-center">
            <strong>Your Location</strong>
            <p className="text-sm text-gray-600">You are here</p>
          </div>
        </Popup>
      </Marker>

      {/* Safe Zone Markers */}
      {safeZones.map((zone) => (
        <span key={`safe-${zone.id}`}>
          <Marker position={[zone.latitude, zone.longitude]} icon={safeZoneIcon}>
            <Popup>
              <div className="text-center">
                <strong className="text-green-700">{zone.name}</strong>
                {zone.description && <p className="text-sm text-gray-600">{zone.description}</p>}
                <p className="text-xs text-green-600 font-semibold">Safe Zone</p>
              </div>
            </Popup>
          </Marker>
          <Circle center={[zone.latitude, zone.longitude]} radius={zone.radius}
            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.2 }} />
        </span>
      ))}

      {/* Risk Zone Markers */}
      {riskZones.map((zone) => (
        <span key={`risk-${zone.id}`}>
          <Marker position={[zone.latitude, zone.longitude]}
            icon={zone.riskLevel === 'HIGH' ? riskZoneIcon : cautionZoneIcon}>
            <Popup>
              <div className="text-center">
                <strong className={zone.riskLevel === 'HIGH' ? 'text-red-700' : 'text-yellow-700'}>
                  {zone.name}
                </strong>
                {zone.description && <p className="text-sm text-gray-600">{zone.description}</p>}
                <p className={`text-xs font-semibold ${zone.riskLevel === 'HIGH' ? 'text-red-600' : 'text-yellow-600'}`}>
                  {zone.riskLevel === 'HIGH' ? 'High Risk Zone' : 'Caution Zone'}
                </p>
              </div>
            </Popup>
          </Marker>
          <Circle center={[zone.latitude, zone.longitude]} radius={zone.radius}
            pathOptions={{
              color: zone.riskLevel === 'HIGH' ? '#ef4444' : '#eab308',
              fillColor: zone.riskLevel === 'HIGH' ? '#ef4444' : '#eab308',
              fillOpacity: 0.2,
            }} />
        </span>
      ))}

      {/* Unsafe Incidents Markers */}
      {unsafeIncidents.map((inc) => {
        if (!inc.location) return null;
        return (
          <span key={`incident-${inc.id}`}>
            <Marker position={[inc.location.latitude, inc.location.longitude]} icon={unsafeIncidentIcon}>
              <Popup>
                <div className="text-center w-40">
                  <strong className="text-black uppercase text-sm">{inc.type}</strong>
                  {inc.description && <p className="text-xs text-gray-600 mt-1 line-clamp-3">{inc.description}</p>}
                  <p className="text-[10px] uppercase font-bold text-red-600 mt-2 bg-red-100 py-0.5 rounded-full">1km Unsafe Zone</p>
                </div>
              </Popup>
            </Marker>
            <Circle center={[inc.location.latitude, inc.location.longitude]} radius={1000}
              pathOptions={{ color: '#000000', fillColor: '#000000', fillOpacity: 0.15, dashArray: '4, 4' }} />
          </span>
        );
      })}

      {/* ── Service Markers ── */}
      {services.filter(s => s.latitude && s.longitude).map((svc) => {
        const icon = SERVICE_ICONS[svc.type] ?? SERVICE_ICONS['HOSPITAL'];
        const meta = SERVICE_LABELS[svc.type];
        return (
          <Marker key={svc.id} position={[svc.latitude!, svc.longitude!]} icon={icon}>
            <Popup>
              <div style={{ minWidth: 140 }}>
                <p className={`font-semibold text-sm ${meta?.color ?? 'text-gray-800'}`}>
                  {svc.name}
                </p>
                <p className="text-xs text-gray-500 mb-1">{meta?.label}</p>
                {svc.address && <p className="text-xs text-gray-600 mb-1">{svc.address}</p>}
                <a href={`tel:${svc.phone}`}
                  className="text-xs text-blue-600 font-medium hover:underline block">
                  📞 {svc.phone}
                </a>
                {svc.email && (
                  <a href={`mailto:${svc.email}`}
                    className="text-xs text-gray-500 hover:underline block mt-0.5">
                    ✉️ {svc.email}
                  </a>
                )}
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

  // Active service legend filter
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

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
    } else {
      fetchData(28.6139, 77.2090);
    }
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
    } catch (err) {
      console.error('Failed to fetch map data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to calculate distance in meters
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  };

  // Check proximity whenever location or incidents change
  useEffect(() => {
    if (unsafeIncidents.length === 0) return;
    
    unsafeIncidents.forEach((incident) => {
      if (!incident.location) return;
      
      const distance = calculateDistanceMeters(
        userLocation[0], userLocation[1],
        incident.location.latitude, incident.location.longitude
      );
      
      // If within 1km and haven't notified yet in this session
      if (distance <= 1000 && !notifiedZonesRef.current.has(incident.id)) {
        notifiedZonesRef.current.add(incident.id);
        
        toast.error(`⚠️ Unsafe Area Nearby!`, {
          description: `You are within 1km of a reported ${incident.type.toLowerCase()} incident. Please stay alert.`,
          duration: 10000,
          position: 'top-center',
        });
      }
    });
  }, [userLocation, unsafeIncidents]);

  const handleRecenter = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(loc);
        fetchData(loc[0], loc[1]);
      },
      () => alert('Could not get your location. Enable location services.')
    );
  };

  // Filter displayed services by legend pill
  const visibleServices = activeFilter ? services.filter(s => s.type === activeFilter) : services;
  const serviceGroups = [
    { type: 'HOSPITAL', label: 'Hospitals', icon: Hospital, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    { type: 'POLICE_STATION', label: 'Police', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    { type: 'INSURANCE_AGENT', label: 'Insurance', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    { type: 'AMBULANCE', label: 'Ambulance', icon: Car, color: 'text-orange-500', bg: 'bg-orange-50 border-orange-200' },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 text-white p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Safe Route Map</h1>
            <p className="text-purple-100">Find the safest path</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Enter destination..."
            className="pl-12 h-12 rounded-2xl bg-white"
          />
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Service type filter pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${activeFilter === null ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}>
            All
          </button>
          {serviceGroups.map(g => {
            const count = services.filter(s => s.type === g.type).length;
            return (
              <button key={g.type}
                onClick={() => setActiveFilter(activeFilter === g.type ? null : g.type)}
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
                userLocation={userLocation}
                safeZones={safeZones}
                riskZones={riskZones}
                services={visibleServices}
                unsafeIncidents={unsafeIncidents}
              />
            ) : (
              <div className="h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-purple-600 mx-auto mb-2 animate-pulse" />
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            )}

            {/* Map Legend */}
            <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-3 z-[1000] text-xs space-y-1">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full" /><span>You</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full" /><span>Safe</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-500 rounded-full" /><span>Caution</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full" /><span>Risk</span></div>
              <div className="border-t border-gray-100 pt-1 space-y-1">
                <div className="flex items-center gap-2"><span>🏥</span><span>Hospital</span></div>
                <div className="flex items-center gap-2"><span>🚔</span><span>Police</span></div>
                <div className="flex items-center gap-2"><span>🏢</span><span>Insurance</span></div>
                <div className="flex items-center gap-2"><span>🚑</span><span>Ambulance</span></div>
              </div>
            </div>

            {/* Recenter */}
            <button
              onClick={handleRecenter}
              className="absolute bottom-4 right-4 bg-white rounded-full p-3 shadow-lg hover:shadow-xl z-[1000]"
              title="Recenter map">
              <Locate className="w-5 h-5 text-purple-600" />
            </button>
          </div>

          <div className="p-4 flex gap-2">
            <Button className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700">
              <Navigation className="w-5 h-5 mr-2" />
              Start Navigation
            </Button>
          </div>
        </div>

        {/* Risk Zone Warning */}
        {showWarning && riskZones.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Risk Zones Detected!</h3>
                <p className="text-sm text-red-700">
                  {riskZones.length + unsafeIncidents.length} risk zone(s) found nearby. Consider taking an alternative route.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nearby Services List */}
        {services.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <MapPin className="w-6 h-6 text-purple-600" />
              Nearby Services
              {loading && <Loader className="w-4 h-4 animate-spin text-gray-400" />}
            </h2>
            <div className="space-y-2">
              {visibleServices.map(svc => {
                const meta = SERVICE_LABELS[svc.type];
                const group = serviceGroups.find(g => g.type === svc.type);
                return (
                  <div key={svc.id}
                    className={`bg-white rounded-2xl p-4 shadow-md border flex items-center justify-between hover:shadow-lg transition-shadow ${group?.bg ?? 'border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${group?.bg ?? 'bg-gray-100'}`}>
                        {svc.type === 'HOSPITAL' && '🏥'}
                        {svc.type === 'POLICE_STATION' && '🚔'}
                        {svc.type === 'INSURANCE_AGENT' && '🏢'}
                        {svc.type === 'AMBULANCE' && '🚑'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{svc.name}</h3>
                        <p className={`text-xs font-medium ${meta?.color ?? 'text-gray-500'}`}>{meta?.label}</p>
                        {svc.address && <p className="text-xs text-gray-400 line-clamp-1">{svc.address}</p>}
                      </div>
                    </div>
                    <a href={`tel:${svc.phone}`}
                      className="flex-shrink-0 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                      Call
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Safe Zones List */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-600" />
            Nearby Safe Zones {loading && <Loader className="w-4 h-4 animate-spin text-gray-400" />}
          </h2>
          <div className="space-y-2">
            {safeZones.map((zone) => (
              <div key={zone.id}
                className="bg-white rounded-2xl p-4 shadow-md flex items-center justify-between hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                    <p className="text-sm text-gray-500">{zone.description || 'Safe area'}</p>
                  </div>
                </div>
                <Button size="sm" className="rounded-xl bg-green-600 hover:bg-green-700">Navigate</Button>
              </div>
            ))}
            {!loading && safeZones.length === 0 && (
              <p className="text-center text-gray-500 py-4">No safe zones found nearby</p>
            )}
          </div>
        </div>

        {/* Risk Zones */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Areas to Avoid
          </h2>
          <div className="space-y-2">
            {riskZones.map((zone) => (
              <div key={zone.id}
                className="bg-white rounded-2xl p-4 shadow-md flex items-center justify-between border-l-4 border-red-500 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${zone.riskLevel === 'HIGH' ? 'bg-red-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center`}>
                    <AlertTriangle className={`w-5 h-5 ${zone.riskLevel === 'HIGH' ? 'text-red-600' : 'text-yellow-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                    <p className="text-sm text-gray-500">{zone.description || 'Risk area'}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${zone.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {zone.riskLevel === 'HIGH' ? 'High Risk' : 'Caution'}
                </span>
              </div>
            ))}
            {!loading && riskZones.length === 0 && (
              <p className="text-center text-gray-500 py-4">No risk zones found nearby</p>
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
