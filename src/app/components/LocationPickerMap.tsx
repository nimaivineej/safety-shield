import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
    value: { latitude: number | null; longitude: number | null; address: string };
    onChange: (loc: { latitude: number; longitude: number; address: string }) => void;
    onClose: () => void;
}

interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
}

// Moves the map when flyTo changes
function MapFlyController({ center }: { center: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 16, { duration: 1.2 });
    }, [center, map]);
    return null;
}

// Listens for map clicks
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
    return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`;
        const res = await fetch(url);
        const data = await res.json();
        return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
}

export function LocationPickerMap({ value, onChange, onClose }: Props) {
    const indiaCenter: [number, number] = [20.5937, 78.9629];
    const initialCenter: [number, number] =
        value.latitude && value.longitude ? [value.latitude, value.longitude] : indiaCenter;
    const initialZoom = value.latitude ? 14 : 5;

    const [markerPos, setMarkerPos] = useState<[number, number] | null>(
        value.latitude && value.longitude ? [value.latitude, value.longitude] : null
    );
    const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
    const [selectedAddress, setSelectedAddress] = useState(value.address || '');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const searchBarRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const runSearch = useCallback(async (q: string) => {
        if (!q.trim()) { setSearchResults([]); setShowDropdown(false); return; }
        setSearching(true);
        try {
            // No custom headers — avoids CORS preflight. Use URL params instead.
            const url =
                `https://nominatim.openstreetmap.org/search` +
                `?q=${encodeURIComponent(q)}` +
                `&format=json&limit=6&addressdetails=1&accept-language=en`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: NominatimResult[] = await res.json();
            setSearchResults(data);
            setShowDropdown(data.length > 0);
        } catch (err) {
            console.error('Nominatim search error:', err);
            setSearchResults([]);
            setShowDropdown(false);
        } finally {
            setSearching(false);
        }
    }, []);

    const handleInput = (q: string) => {
        setSearchQuery(q);
        clearTimeout(debounceRef.current);
        if (!q.trim()) { setSearchResults([]); setShowDropdown(false); return; }
        debounceRef.current = setTimeout(() => runSearch(q), 500);
    };

    const handleSelectResult = (r: NominatimResult) => {
        const lat = parseFloat(r.lat);
        const lng = parseFloat(r.lon);
        setMarkerPos([lat, lng]);
        setFlyTo([lat, lng]);
        setSelectedAddress(r.display_name);
        setSearchQuery(r.display_name);
        setSearchResults([]);
        setShowDropdown(false);
    };

    const handleMapClick = useCallback(async (lat: number, lng: number) => {
        setMarkerPos([lat, lng]);
        const addr = await reverseGeocode(lat, lng);
        setSelectedAddress(addr);
    }, []);

    const handleConfirm = () => {
        if (!markerPos) return;
        onChange({ latitude: markerPos[0], longitude: markerPos[1], address: selectedAddress });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col"
                style={{ height: '82vh' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-red-400" />
                        <h3 className="text-base font-semibold text-white">Pick Location on Map</h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search bar — z-[500] keeps it above Leaflet (max ~700 for popup pane) */}
                <div className="px-4 pt-3 pb-2 flex-shrink-0" style={{ zIndex: 500, position: 'relative' }} ref={searchBarRef}>
                    <div className="relative">
                        {searching
                            ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                            : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => handleInput(e.target.value)}
                            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                            placeholder="Search for a place, hospital, police station…"
                            autoComplete="off"
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                        />
                    </div>

                    {/* Dropdown — must sit above the Leaflet map tiles (z-index 200) and marker pane (600) */}
                    {showDropdown && searchResults.length > 0 && (
                        <div className="absolute left-4 right-4 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden"
                            style={{ zIndex: 1000 }}>
                            {searchResults.map(r => (
                                <button
                                    key={r.place_id}
                                    onMouseDown={e => { e.preventDefault(); handleSelectResult(r); }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 border-b border-gray-700/50 last:border-0 transition-colors">
                                    <span className="line-clamp-2 leading-snug">{r.display_name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Map */}
                <div className="flex-1 mx-4 mb-2 rounded-xl overflow-hidden border border-gray-700 min-h-0">
                    <MapContainer
                        center={initialCenter}
                        zoom={initialZoom}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={true}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        <ClickHandler onPick={handleMapClick} />
                        <MapFlyController center={flyTo} />
                        {markerPos && <Marker position={markerPos} />}
                    </MapContainer>
                </div>

                {/* Footer */}
                <div className="px-4 pb-4 flex-shrink-0 space-y-2.5">
                    {markerPos ? (
                        <p className="text-xs text-gray-400 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{selectedAddress}</span>
                        </p>
                    ) : (
                        <p className="text-xs text-gray-500 text-center">Search above or click on the map to drop a pin</p>
                    )}
                    <div className="flex gap-3">
                        <button onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-all">
                            Cancel
                        </button>
                        <button onClick={handleConfirm} disabled={!markerPos}
                            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm text-white font-medium transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
                            Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
