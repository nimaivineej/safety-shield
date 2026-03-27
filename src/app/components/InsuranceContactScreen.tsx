import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Phone, Mail, Upload, CheckCircle, Shield,
    Clock, MapPin, User, X, Send, FileImage, Plus, Pencil, Trash2, Save,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const STORAGE_KEY = 'insurance_agent';

interface Agent {
    name: string;
    company: string;
    designation: string;
    phone: string;
    email: string;
    claimHotline: string;
    workingHours: string;
}

const EMPTY_AGENT: Agent = {
    name: '', company: '', designation: '',
    phone: '', email: '', claimHotline: '', workingHours: '',
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

    // Load saved agent from localStorage
    const [agent, setAgent] = useState<Agent | null>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Agent>(agent ?? EMPTY_AGENT);
    const [formError, setFormError] = useState('');

    // Photo upload
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
            reader.onload = (ev) => setPreviews((prev) => [...prev, ev.target?.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
        setPreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSendToAgent = async () => {
        if (!agent) return;
        if (!agent.email) {
            alert("Please add the agent's email address to send photos.");
            return;
        }
        setSending(true);
        try {
            const api = (await import('../../services/api')).default;
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const formData = new FormData();
            formData.append('agentEmail', agent.email);
            formData.append('userName', user.name || 'SafetyShield User');
            if (incidentId) formData.append('incidentId', incidentId);
            photos.forEach((photo) => formData.append('photos', photo));

            await api.post('/notifications/send-claim-email', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setSent(true);
        } catch (err) {
            console.error('Failed to send photos:', err);
            alert('Failed to send photos. Please check the agent email and try again.');
        } finally {
            setSending(false);
        }
    };

    const handleSaveAgent = () => {
        if (!form.name.trim() || !form.phone.trim()) {
            setFormError('Name and phone number are required.');
            return;
        }
        setFormError('');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
        setAgent(form);
        setShowForm(false);
    };

    const handleEditAgent = () => {
        setForm(agent!);
        setShowForm(true);
    };

    const handleDeleteAgent = () => {
        if (!window.confirm('Remove this insurance agent?')) return;
        localStorage.removeItem(STORAGE_KEY);
        setAgent(null);
        setForm(EMPTY_AGENT);
    };

    /* ── Success screen ── */
    if (sent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Photos Sent!</h2>
                <p className="text-gray-600 mb-1">
                    Your photos have been sent to <span className="font-semibold">{agent?.name}</span>.
                </p>
                <p className="text-gray-500 text-sm mb-8">The agent will contact you soon.</p>
                <Button onClick={() => navigate('/home')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-3 rounded-2xl">
                    Return to Home
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 pb-8">

            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 pt-6 pb-8">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => navigate('/home')}
                        className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Insurance Claim</h1>
                        <p className="text-amber-100 text-sm">Accident Report Assistance</p>
                    </div>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 flex items-start gap-3">
                    <Shield className="w-6 h-6 text-white shrink-0 mt-0.5" />
                    <p className="text-sm text-white leading-relaxed">
                        Add your insurance agent's details so you can quickly contact them after an incident.
                    </p>
                </div>
            </div>

            <div className="px-5 -mt-4 space-y-4">

                {/* Incident Summary (only when navigated from incident) */}
                {incidentId && (
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <FileImage className="w-4 h-4 text-orange-500" />Incident Summary
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Incident ID</span>
                                <span className="font-mono font-semibold text-gray-800 text-xs">{incidentId.slice(0, 16).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Type</span>
                                <span className="font-semibold text-orange-600">🚗 Accident</span>
                            </div>
                            {timestamp && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Reported at</span>
                                    <span className="font-semibold text-gray-800">{new Date(timestamp).toLocaleString()}</span>
                                </div>
                            )}
                            {location && (
                                <div className="flex items-start justify-between gap-4">
                                    <span className="text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />Location</span>
                                    <span className="text-gray-800 text-right text-xs font-mono">{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
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
                )}

                {/* ── Add / Edit Agent Form ── */}
                {showForm && (
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <User className="w-4 h-4 text-amber-500" />
                            {agent ? 'Edit Agent' : 'Add Insurance Agent'}
                        </h2>
                        <div className="space-y-3">
                            {[
                                { label: 'Full Name *', key: 'name', placeholder: 'e.g. Rajesh Kumar' },
                                { label: 'Company', key: 'company', placeholder: 'e.g. SafeGuard Insurance' },
                                { label: 'Designation', key: 'designation', placeholder: 'e.g. Claims Officer' },
                                { label: 'Phone *', key: 'phone', placeholder: '+91 98765 43210', type: 'tel' },
                                { label: 'Claim Hotline', key: 'claimHotline', placeholder: '1800-123-4567', type: 'tel' },
                                { label: 'Email', key: 'email', placeholder: 'agent@company.com', type: 'email' },
                                { label: 'Working Hours', key: 'workingHours', placeholder: 'Mon–Sat, 9 AM – 6 PM' },
                            ].map(({ label, key, placeholder, type }) => (
                                <div key={key}>
                                    <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                                    <Input
                                        type={type ?? 'text'}
                                        placeholder={placeholder}
                                        value={(form as any)[key]}
                                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                                        className="h-11 rounded-xl border-gray-200 focus:border-amber-400"
                                    />
                                </div>
                            ))}
                            {formError && <p className="text-sm text-red-500">{formError}</p>}
                        </div>
                        <div className="flex gap-3 mt-5">
                            <Button onClick={handleSaveAgent}
                                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl h-11">
                                <Save className="w-4 h-4 mr-2" />Save Agent
                            </Button>
                            <Button variant="outline" onClick={() => setShowForm(false)}
                                className="h-11 px-4 rounded-xl border-gray-200">
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Agent Card (when saved) ── */}
                {agent && !showForm && (
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <User className="w-4 h-4 text-amber-500" />Your Insurance Agent
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={handleEditAgent}
                                    className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center hover:bg-amber-100 transition-colors">
                                    <Pencil className="w-4 h-4 text-amber-600" />
                                </button>
                                <button onClick={handleDeleteAgent}
                                    className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors">
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                            </div>
                        </div>

                        {/* Avatar + identity */}
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xl font-bold shadow">
                                {agent.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{agent.name}</p>
                                {agent.designation && <p className="text-sm text-gray-600">{agent.designation}</p>}
                                {agent.company && <p className="text-xs text-amber-600 font-medium">{agent.company}</p>}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-2 text-sm mb-5">
                            {agent.phone && (
                                <div className="flex items-center gap-3 text-gray-700">
                                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div><p className="text-xs text-gray-500">Direct Phone</p><p className="font-semibold">{agent.phone}</p></div>
                                </div>
                            )}
                            {agent.claimHotline && (
                                <div className="flex items-center gap-3 text-gray-700">
                                    <Phone className="w-4 h-4 text-green-500 shrink-0" />
                                    <div><p className="text-xs text-gray-500">Claim Hotline</p><p className="font-semibold text-green-700">{agent.claimHotline}</p></div>
                                </div>
                            )}
                            {agent.email && (
                                <div className="flex items-center gap-3 text-gray-700">
                                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div><p className="text-xs text-gray-500">Email</p><p className="font-semibold">{agent.email}</p></div>
                                </div>
                            )}
                            {agent.workingHours && (
                                <div className="flex items-center gap-3 text-gray-700">
                                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                                    <div><p className="text-xs text-gray-500">Working Hours</p><p className="font-semibold">{agent.workingHours}</p></div>
                                </div>
                            )}
                        </div>

                        {/* CTA buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <a href={`tel:${agent.claimHotline || agent.phone}`}>
                                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl">
                                    <Phone className="w-4 h-4 mr-2" />Call Agent
                                </Button>
                            </a>
                            {agent.email && (
                                <a href={`mailto:${agent.email}?subject=Accident%20Claim&body=Incident%20ID%3A%20${incidentId || 'N/A'}`}>
                                    <Button className="w-full bg-white border border-amber-400 text-amber-700 hover:bg-amber-50 rounded-xl">
                                        <Mail className="w-4 h-4 mr-2" />Email Agent
                                    </Button>
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Empty state: no agent added yet ── */}
                {!agent && !showForm && (
                    <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-8 h-8 text-amber-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">No Insurance Agent Added</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Add your insurance agent's contact details so you can reach them quickly during an emergency or accident.
                        </p>
                        <Button onClick={() => { setForm(EMPTY_AGENT); setShowForm(true); }}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl px-6 h-11">
                            <Plus className="w-4 h-4 mr-2" />Add Insurance Agent
                        </Button>
                    </div>
                )}

                {/* ── Photo Upload (only if agent is saved) ── */}
                {agent && !showForm && (
                    <div className="bg-white rounded-2xl shadow-sm p-5">
                        <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-amber-500" />Send Accident Photos
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            Upload photos of the accident site, vehicle damage, or any evidence to speed up your claim.
                        </p>
                        <button type="button" onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center hover:border-amber-500 hover:bg-amber-50 transition-all">
                            <Upload className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                            <p className="text-gray-700 font-medium">Tap to upload photos</p>
                            <p className="text-sm text-gray-400 mt-1">JPG, PNG, HEIC — up to 20 MB each</p>
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />

                        {previews.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-4">
                                {previews.map((src, i) => (
                                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                                        <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => removePhoto(i)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                            <X className="w-3 h-3 text-white" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {photos.length > 0 && (
                            <Button onClick={handleSendToAgent} disabled={sending}
                                className="w-full mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl h-12">
                                {sending ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Sending…</>
                                ) : (
                                    <><Send className="w-4 h-4 mr-2" />Send {photos.length} Photo{photos.length > 1 ? 's' : ''} to Agent</>
                                )}
                            </Button>
                        )}
                    </div>
                )}

                {/* Footer note */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
                    <p className="font-semibold mb-1">📋 What happens next?</p>
                    <ul className="space-y-1 text-amber-800 list-disc list-inside">
                        <li>Authorities will be notified of your accident</li>
                        <li>Your insurance agent will contact you</li>
                        <li>Keep all documents &amp; photos safe for the claim process</li>
                    </ul>
                </div>

                <Button onClick={() => navigate('/home')}
                    className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-2xl h-12">
                    Return to Home
                </Button>
            </div>
        </div>
    );
}
