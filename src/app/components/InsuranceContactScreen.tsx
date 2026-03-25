import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Phone,
    Mail,
    Upload,
    CheckCircle,
    Shield,
    Clock,
    MapPin,
    User,
    X,
    Send,
    FileImage,
} from 'lucide-react';
import { Button } from './ui/button';

/* ─────────────────────────────────────────────
   Mock insurance agent data
   (Replace with a real API call in production)
───────────────────────────────────────────── */
const INSURANCE_AGENT = {
    name: 'Rajesh Kumar',
    company: 'SafeGuard Insurance Pvt. Ltd.',
    designation: 'Accident Claims Officer',
    phone: '+91 98765 43210',
    email: 'claims@safeguardinsurance.in',
    claimHotline: '1800-123-4567',
    workingHours: 'Mon – Sat, 9:00 AM – 6:00 PM',
    avgResponseTime: 'Within 24 hours',
};

interface RouterState {
    incidentId?: string;
    description?: string;
    location?: { latitude: number; longitude: number };
    timestamp?: string;
}

export function InsuranceContactScreen() {
    const navigate = useNavigate();
    const routerState = (useLocation().state as RouterState) || {};

    const { incidentId, description, location, timestamp } = routerState;

    /* Photo upload state */
    const [photos, setPhotos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setPhotos((prev) => [...prev, ...files]);

        files.forEach((file) => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setPreviews((prev) => [...prev, ev.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSendToAgent = async () => {
        setSending(true);
        /* In production: POST photos + incidentId to backend, which emails the agent */
        await new Promise((r) => setTimeout(r, 1800)); // simulate network
        setSending(false);
        setSent(true);
    };

    /* ── Success state after sending photos ── */
    if (sent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Photos Sent!</h2>
                <p className="text-gray-600 mb-1">
                    Your photos have been sent to <span className="font-semibold">{INSURANCE_AGENT.name}</span>.
                </p>
                <p className="text-gray-500 text-sm mb-8">
                    The agent will contact you within {INSURANCE_AGENT.avgResponseTime.toLowerCase()}.
                </p>
                <Button
                    onClick={() => navigate('/home')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-3 rounded-2xl"
                >
                    Return to Home
                </Button>
            </div>
        );
    }

    /* ── Main page ── */
    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 pb-8">

            {/* ── Header ── */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 pt-6 pb-8">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={() => navigate('/home')}
                        className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Insurance Claim</h1>
                        <p className="text-amber-100 text-sm">Accident Report Assistance</p>
                    </div>
                </div>

                {/* Top banner */}
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-start gap-3">
                    <Shield className="w-6 h-6 text-white shrink-0 mt-0.5" />
                    <p className="text-sm text-white leading-relaxed">
                        Your accident report has been submitted to authorities. An insurance agent
                        is ready to assist you with your claim. Please contact them as soon as possible.
                    </p>
                </div>
            </div>

            <div className="px-5 -mt-4 space-y-4">

                {/* ── Incident Summary Card ── */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FileImage className="w-4 h-4 text-orange-500" />
                        Incident Summary
                    </h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Incident ID</span>
                            <span className="font-mono font-semibold text-gray-800 text-xs">
                                {incidentId ? incidentId.slice(0, 16).toUpperCase() : '—'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Type</span>
                            <span className="font-semibold text-orange-600">🚗 Accident</span>
                        </div>
                        {timestamp && (
                            <div className="flex justify-between">
                                <span className="text-gray-500">Reported at</span>
                                <span className="font-semibold text-gray-800">
                                    {new Date(timestamp).toLocaleString()}
                                </span>
                            </div>
                        )}
                        {location && (
                            <div className="flex items-start justify-between gap-4">
                                <span className="text-gray-500 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />Location
                                </span>
                                <span className="text-gray-800 text-right text-xs font-mono">
                                    {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                                </span>
                            </div>
                        )}
                        {description && (
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-gray-500 mb-1">Description</p>
                                <p className="text-gray-800">{description}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Insurance Agent Card ── */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-amber-500" />
                        Your Insurance Agent
                    </h2>

                    {/* Agent identity */}
                    <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow">
                            {INSURANCE_AGENT.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">{INSURANCE_AGENT.name}</p>
                            <p className="text-sm text-gray-600">{INSURANCE_AGENT.designation}</p>
                            <p className="text-xs text-amber-600 font-medium">{INSURANCE_AGENT.company}</p>
                        </div>
                    </div>

                    {/* Agent details */}
                    <div className="space-y-2 text-sm mb-5">
                        <div className="flex items-center gap-3 text-gray-700">
                            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500">Direct Phone</p>
                                <p className="font-semibold">{INSURANCE_AGENT.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <Phone className="w-4 h-4 text-green-500 shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500">Free Claim Hotline</p>
                                <p className="font-semibold text-green-700">{INSURANCE_AGENT.claimHotline}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="font-semibold">{INSURANCE_AGENT.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500">Working Hours</p>
                                <p className="font-semibold">{INSURANCE_AGENT.workingHours}</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <a href={`tel:${INSURANCE_AGENT.claimHotline}`}>
                            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl">
                                <Phone className="w-4 h-4 mr-2" />
                                Call Agent
                            </Button>
                        </a>
                        <a
                            href={`mailto:${INSURANCE_AGENT.email}?subject=Accident%20Claim%20-%20Incident%20Report&body=Incident%20ID%3A%20${incidentId || 'N/A'}`}
                        >
                            <Button className="w-full bg-white border border-amber-400 text-amber-700 hover:bg-amber-50 rounded-xl">
                                <Mail className="w-4 h-4 mr-2" />
                                Email Agent
                            </Button>
                        </a>
                    </div>
                </div>

                {/* ── Photo Upload Section ── */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <Upload className="w-4 h-4 text-amber-500" />
                        Send Accident Photos
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Upload photos of the accident site, vehicle damage, or any evidence to speed up your claim.
                    </p>

                    {/* Upload area */}
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center hover:border-amber-500 hover:bg-amber-50 transition-all"
                    >
                        <Upload className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                        <p className="text-gray-700 font-medium">Tap to upload photos</p>
                        <p className="text-sm text-gray-400 mt-1">JPG, PNG, HEIC — up to 20 MB each</p>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePhotoChange}
                    />

                    {/* Photo previews */}
                    {previews.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            {previews.map((src, i) => (
                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                                    <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removePhoto(i)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Send button */}
                    {photos.length > 0 && (
                        <Button
                            onClick={handleSendToAgent}
                            disabled={sending}
                            className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl h-12"
                        >
                            {sending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Sending…
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send {photos.length} Photo{photos.length > 1 ? 's' : ''} to Agent
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* ── Footer note ── */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
                    <p className="font-semibold mb-1">📋 What happens next?</p>
                    <ul className="space-y-1 text-amber-800 list-disc list-inside">
                        <li>Authorities have already been notified of your accident</li>
                        <li>The insurance agent will call you within 24 hours</li>
                        <li>Keep all documents &amp; photos safe for the claim process</li>
                    </ul>
                </div>

                <Button
                    onClick={() => navigate('/home')}
                    className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-2xl h-12"
                >
                    Return to Home
                </Button>
            </div>
        </div>
    );
}
