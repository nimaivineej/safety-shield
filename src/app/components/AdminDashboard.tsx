import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, Users, AlertTriangle, FileText, LogOut,
    TrendingUp, Activity, CheckCircle, Clock, Trash2,
    ChevronRight, RefreshCw, Eye, Plus, X, Edit2,
    Hospital, Phone, Mail, MapPin, Building2, Car, ShieldCheck,
    MessageSquare, Check
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { supportService, SupportTicket } from '../../services/support.service';
import api from '../../services/api';
import { LocationPickerMap } from './LocationPickerMap';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
    totalUsers: number; totalVolunteers: number; totalIncidents: number;
    totalSOS: number; activeAlerts: number; resolvedAlerts: number;
}
interface User {
    id: string; name: string; email: string; phone?: string; role: string;
    isVerified: boolean; createdAt: string;
    _count: { sosAlerts: number; incidentReports: number };
}
interface SOSAlert {
    id: string; status: string; triggeredAt: string; resolvedAt?: string;
    user: { name: string; email: string; phone?: string };
    location?: { latitude: number; longitude: number; address?: string };
}
interface Incident {
    id: string; type: string; status: string; description: string;
    createdAt: string; user: { name: string; email: string };
    location?: { latitude: number; longitude: number; address?: string };
}
interface Service {
    id: string; type: ServiceType; name: string; phone: string;
    email?: string; latitude?: number; longitude?: number;
    address?: string; createdAt: string;
}
type ServiceType = 'HOSPITAL' | 'POLICE_STATION' | 'INSURANCE_AGENT' | 'AMBULANCE';
type Tab = 'overview' | 'users' | 'sos' | 'incidents' | 'services' | 'tickets';

const SERVICE_TYPES: { value: ServiceType; label: string; icon: any; color: string; hasLocation: boolean }[] = [
    { value: 'HOSPITAL', label: 'Hospital', icon: Hospital, color: 'text-red-400', hasLocation: true },
    { value: 'POLICE_STATION', label: 'Police Station', icon: ShieldCheck, color: 'text-blue-400', hasLocation: true },
    { value: 'INSURANCE_AGENT', label: 'Insurance Agent', icon: Building2, color: 'text-purple-400', hasLocation: false },
    { value: 'AMBULANCE', label: 'Ambulance', icon: Car, color: 'text-orange-400', hasLocation: false },
];

const defaultForm = { type: 'HOSPITAL' as ServiceType, name: '', phone: '', email: '', latitude: '', longitude: '', address: '' };

// ─── Component ─────────────────────────────────────────────────────────────────

export function AdminDashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [sosAlerts, setSosAlerts] = useState<SOSAlert[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);

    // Services form state
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [serviceForm, setServiceForm] = useState(defaultForm);
    const [serviceSaving, setServiceSaving] = useState(false);
    const [serviceFilter, setServiceFilter] = useState<ServiceType | 'ALL'>('ALL');
    const [showMapPicker, setShowMapPicker] = useState(false);

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (!user || user.role !== 'ADMIN') { navigate('/login'); return; }
        setCurrentUser(user);
        fetchAll();
    }, [navigate]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, sosRes, incRes, svcRes, tktRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/users'),
                api.get('/admin/sos-alerts'),
                api.get('/admin/incidents'),
                api.get('/admin/services'),
                supportService.getAdminTickets()
            ]);
            setStats(statsRes.data.data);
            setUsers(usersRes.data.data.users || []);
            setSosAlerts(sosRes.data.data || []);
            setIncidents(incRes.data.data || []);
            setServices(svcRes.data.data || []);
            setTickets(tktRes || []);
        } catch (err) { console.error('Admin fetch failed:', err); }
        finally { setLoading(false); }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Delete this user permanently?')) return;
        try { await api.delete(`/admin/users/${id}`); setUsers(users.filter(u => u.id !== id)); }
        catch (err) { console.error('Delete failed:', err); }
    };

    const handleResolveAlert = async (id: string) => {
        try {
            await api.patch(`/admin/sos-alerts/${id}/resolve`);
            setSosAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'RESOLVED' } : a));
        } catch (err) { console.error('Resolve failed:', err); }
    };

    const handleUpdateTicketStatus = async (id: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
        try {
            const updated = await supportService.updateTicketStatus(id, status);
            setTickets(prev => prev.map(t => t.id === id ? updated : t));
        } catch (err) { console.error('Update ticket failed:', err); }
    };

    const handleLogout = () => { authService.logout(); navigate('/login'); };

    // ── Services CRUD ──────────────────────────────────────────────────────
    const openAddService = () => {
        setEditingService(null);
        setServiceForm(defaultForm);
        setShowServiceForm(true);
    };
    const openEditService = (svc: Service) => {
        setEditingService(svc);
        setServiceForm({
            type: svc.type, name: svc.name, phone: svc.phone,
            email: svc.email || '', latitude: svc.latitude?.toString() || '',
            longitude: svc.longitude?.toString() || '', address: svc.address || '',
        });
        setShowServiceForm(true);
    };
    const closeServiceForm = () => { setShowServiceForm(false); setEditingService(null); };

    const handleServiceSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setServiceSaving(true);
        try {
            const body = {
                type: serviceForm.type,
                name: serviceForm.name,
                phone: serviceForm.phone,
                email: serviceForm.email || null,
                latitude: serviceForm.latitude ? parseFloat(serviceForm.latitude) : null,
                longitude: serviceForm.longitude ? parseFloat(serviceForm.longitude) : null,
                address: serviceForm.address || null,
            };
            if (editingService) {
                const { data } = await api.put(`/admin/services/${editingService.id}`, body);
                setServices(prev => prev.map(s => s.id === editingService.id ? data.data : s));
            } else {
                const { data } = await api.post('/admin/services', body);
                setServices(prev => [data.data, ...prev]);
            }
            closeServiceForm();
        } catch (err) { console.error('Save service failed:', err); }
        finally { setServiceSaving(false); }
    };

    const handleDeleteService = async (id: string) => {
        if (!confirm('Delete this service?')) return;
        try { await api.delete(`/admin/services/${id}`); setServices(prev => prev.filter(s => s.id !== id)); }
        catch (err) { console.error('Delete service failed:', err); }
    };

    // ── Derived ────────────────────────────────────────────────────────────
    const statCards = stats ? [
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-violet-500 to-purple-600' },
        { label: 'Volunteers', value: stats.totalVolunteers, icon: TrendingUp, color: 'from-emerald-500 to-green-600' },
        { label: 'Active SOS', value: stats.activeAlerts, icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
        { label: 'Incidents', value: stats.totalIncidents, icon: FileText, color: 'from-amber-500 to-orange-500' },
        { label: 'Total SOS', value: stats.totalSOS, icon: Activity, color: 'from-blue-500 to-cyan-500' },
        { label: 'Resolved', value: stats.resolvedAlerts, icon: CheckCircle, color: 'from-teal-500 to-green-500' },
    ] : [];

    const tabs: { id: Tab; label: string; icon: any }[] = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'sos', label: 'SOS Alerts', icon: AlertTriangle },
        { id: 'incidents', label: 'Incidents', icon: FileText },
        { id: 'services', label: 'Services', icon: Hospital },
        { id: 'tickets', label: 'Support Tickets', icon: MessageSquare },
    ];

    const selectedTypeInfo = SERVICE_TYPES.find(t => t.value === serviceForm.type);
    const filteredServices = serviceFilter === 'ALL' ? services : services.filter(s => s.type === serviceFilter);

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="flex h-screen overflow-hidden">

                {/* ── Sidebar ── */}
                <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col flex-shrink-0">
                    <div className="p-6 border-b border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-white text-sm">SafetyShield</h1>
                                <p className="text-xs text-red-400 font-semibold tracking-wider">ADMIN PANEL</p>
                            </div>
                        </div>
                    </div>
                    <nav className="flex-1 p-4 space-y-1">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                                {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </button>
                        ))}
                    </nav>
                    <div className="p-4 border-t border-gray-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center text-sm font-bold">
                                {currentUser?.name?.[0] ?? 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{currentUser?.name || 'Admin'}</p>
                                <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-all">
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </div>

                {/* ── Main content ── */}
                <div className="flex-1 overflow-y-auto">
                    {/* Top bar */}
                    <div className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                        <div>
                            <h2 className="text-xl font-bold text-white capitalize">{activeTab === 'sos' ? 'SOS Alerts' : activeTab}</h2>
                            <p className="text-sm text-gray-500">SafetyShield Admin Dashboard</p>
                        </div>
                        <div className="flex gap-3">
                            {activeTab === 'services' && (
                                <button onClick={openAddService}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-sm text-white font-medium transition-all shadow-lg shadow-red-500/20">
                                    <Plus className="w-4 h-4" /> Add Service
                                </button>
                            )}
                            <button onClick={fetchAll} disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm text-gray-300 transition-all">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                            </button>
                        </div>
                    </div>

                    <div className="p-8">
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <RefreshCw className="w-10 h-10 text-red-500 animate-spin mx-auto mb-3" />
                                    <p className="text-gray-400">Loading data...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* ── OVERVIEW ── */}
                                {activeTab === 'overview' && (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-3 gap-5">
                                            {statCards.map(card => (
                                                <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                                                            <card.icon className="w-6 h-6 text-white" />
                                                        </div>
                                                        <span className="text-4xl font-bold text-white">{card.value}</span>
                                                    </div>
                                                    <p className="text-gray-400 text-sm font-medium">{card.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                                                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                                    <AlertTriangle className="w-5 h-5 text-red-400" /> Recent SOS
                                                </h3>
                                                <div className="space-y-3">
                                                    {sosAlerts.slice(0, 5).map(a => (
                                                        <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-800">
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{a.user.name}</p>
                                                                <p className="text-xs text-gray-500">{new Date(a.triggeredAt).toLocaleString('en-IN')}</p>
                                                            </div>
                                                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${a.status === 'ACTIVE' ? 'bg-red-500/20 text-red-400' : a.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{a.status}</span>
                                                        </div>
                                                    ))}
                                                    {sosAlerts.length === 0 && <p className="text-gray-500 text-sm">No alerts yet</p>}
                                                </div>
                                            </div>
                                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                                                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                                                    <FileText className="w-5 h-5 text-amber-400" /> Recent Incidents
                                                </h3>
                                                <div className="space-y-3">
                                                    {incidents.slice(0, 5).map(i => (
                                                        <div key={i.id} className="flex items-center justify-between py-2 border-b border-gray-800">
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{i.type.replace('_', ' ')}</p>
                                                                <p className="text-xs text-gray-500">{i.user.name} · {new Date(i.createdAt).toLocaleDateString('en-IN')}</p>
                                                            </div>
                                                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${i.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : i.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{i.status}</span>
                                                        </div>
                                                    ))}
                                                    {incidents.length === 0 && <p className="text-gray-500 text-sm">No incidents yet</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ── USERS ── */}
                                {activeTab === 'users' && (
                                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-800">
                                                        <th className="text-left px-6 py-4 text-gray-400 font-medium">User</th>
                                                        <th className="text-left px-6 py-4 text-gray-400 font-medium">Role</th>
                                                        <th className="text-left px-6 py-4 text-gray-400 font-medium">SOS</th>
                                                        <th className="text-left px-6 py-4 text-gray-400 font-medium">Reports</th>
                                                        <th className="text-left px-6 py-4 text-gray-400 font-medium">Joined</th>
                                                        <th className="text-left px-6 py-4 text-gray-400 font-medium">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {users.map(u => (
                                                        <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">{u.name?.[0] ?? '?'}</div>
                                                                    <div>
                                                                        <p className="font-medium text-white">{u.name}</p>
                                                                        <p className="text-gray-500 text-xs">{u.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : u.role === 'VOLUNTEER' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>{u.role}</span>
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-300">{u._count.sosAlerts}</td>
                                                            <td className="px-6 py-4 text-gray-300">{u._count.incidentReports}</td>
                                                            <td className="px-6 py-4 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                                            <td className="px-6 py-4">
                                                                {u.role !== 'ADMIN' && (
                                                                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete user">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {users.length === 0 && <div className="text-center py-12 text-gray-500">No users found</div>}
                                        </div>
                                    </div>
                                )}

                                {/* ── SOS ALERTS ── */}
                                {activeTab === 'sos' && (
                                    <div className="space-y-4">
                                        {sosAlerts.map(a => (
                                            <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center justify-between hover:border-gray-700 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${a.status === 'ACTIVE' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                        <AlertTriangle className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white">{a.user.name}</p>
                                                        <p className="text-sm text-gray-400">{a.user.email} {a.user.phone ? `· ${a.user.phone}` : ''}</p>
                                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(a.triggeredAt).toLocaleString('en-IN')}</p>
                                                        {a.location && (
                                                            <a href={`https://www.google.com/maps?q=${a.location.latitude},${a.location.longitude}`} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline mt-1 flex items-center gap-1">
                                                                <Eye className="w-3 h-3" />{a.location.address || `${a.location.latitude.toFixed(4)}, ${a.location.longitude.toFixed(4)}`}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${a.status === 'ACTIVE' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : a.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{a.status}</span>
                                                    {a.status === 'ACTIVE' && (
                                                        <button onClick={() => handleResolveAlert(a.id)} className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl text-xs font-medium transition-all border border-green-500/30">
                                                            Mark Resolved
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {sosAlerts.length === 0 && (
                                            <div className="text-center py-16 text-gray-500">
                                                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No SOS alerts found</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── INCIDENTS ── */}
                                {activeTab === 'incidents' && (
                                    <div className="space-y-4">
                                        {incidents.map(i => (
                                            <div key={i.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <FileText className="w-6 h-6 text-amber-400" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <p className="font-semibold text-white">{i.type.replace('_', ' ')}</p>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${i.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : i.status === 'RESOLVED' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>{i.status}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-400 mb-2">{i.description}</p>
                                                        <p className="text-xs text-gray-500">By <span className="text-gray-300">{i.user.name}</span> · {new Date(i.createdAt).toLocaleString('en-IN')}</p>
                                                        {i.location && (
                                                            <a href={`https://www.google.com/maps?q=${i.location.latitude},${i.location.longitude}`} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline mt-1 flex items-center gap-1">
                                                                <Eye className="w-3 h-3" />View on map
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {incidents.length === 0 && (
                                            <div className="text-center py-16 text-gray-500">
                                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No incidents found</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── SERVICES ── */}
                                {activeTab === 'services' && (
                                    <div className="space-y-6">
                                        {/* Type filter pills */}
                                        <div className="flex gap-2 flex-wrap">
                                            <button onClick={() => setServiceFilter('ALL')}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${serviceFilter === 'ALL' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                                                All ({services.length})
                                            </button>
                                            {SERVICE_TYPES.map(t => (
                                                <button key={t.value} onClick={() => setServiceFilter(t.value)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${serviceFilter === t.value ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                                                    <t.icon className="w-4 h-4" />
                                                    {t.label} ({services.filter(s => s.type === t.value).length})
                                                </button>
                                            ))}
                                        </div>

                                        {/* Services grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {filteredServices.map(svc => {
                                                const typeInfo = SERVICE_TYPES.find(t => t.value === svc.type)!;
                                                return (
                                                    <div key={svc.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
                                                                    <typeInfo.icon className={`w-5 h-5 ${typeInfo.color}`} />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-semibold text-white text-sm">{svc.name}</h3>
                                                                    <p className={`text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => openEditService(svc)} className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all">
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button onClick={() => handleDeleteService(svc.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5 text-xs text-gray-400">
                                                            <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{svc.phone}</div>
                                                            {svc.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 flex-shrink-0" />{svc.email}</div>}
                                                            {svc.address && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{svc.address}</div>}
                                                            {(svc.latitude && svc.longitude) && (
                                                                <a href={`https://www.google.com/maps?q=${svc.latitude},${svc.longitude}`} target="_blank" rel="noreferrer"
                                                                    className="flex items-center gap-2 text-blue-400 hover:underline">
                                                                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />{svc.latitude.toFixed(4)}, {svc.longitude.toFixed(4)}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {filteredServices.length === 0 && (
                                            <div className="text-center py-16 text-gray-600">
                                                <Hospital className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="text-gray-400">No services found</p>
                                                <p className="text-sm mt-1">Click "Add Service" to add hospitals, police stations, and more</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── TICKETS ── */}
                                {activeTab === 'tickets' && (
                                    <div className="space-y-4">
                                        {tickets.map(t => (
                                            <div key={t.id} className={`bg-gray-900 border ${t.status === 'OPEN' ? 'border-purple-500/50' : 'border-gray-800'} rounded-2xl p-5 hover:border-gray-700 transition-all`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${t.status === 'OPEN' ? 'bg-purple-500/20 text-purple-400' : t.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                                                            <MessageSquare className="w-6 h-6" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <p className="font-semibold text-white">{t.user.name}</p>
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.status === 'OPEN' ? 'bg-purple-500/20 text-purple-400' : t.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                                                                    {t.status.replace('_', ' ')}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-400 text-sm mb-2">{t.message}</p>
                                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {t.user.email}</span>
                                                                {t.user.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {t.user.phone}</span>}
                                                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(t.createdAt).toLocaleString('en-IN')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {t.status === 'OPEN' && (
                                                            <button onClick={() => handleUpdateTicketStatus(t.id, 'IN_PROGRESS')} className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg text-xs font-medium border border-amber-500/20 transition-colors">
                                                                In Progress
                                                            </button>
                                                        )}
                                                        {t.status !== 'RESOLVED' && (
                                                            <button onClick={() => handleUpdateTicketStatus(t.id, 'RESOLVED')} className="px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg text-xs font-medium border border-green-500/20 transition-colors flex items-center gap-1">
                                                                <Check className="w-3 h-3" /> Resolve
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {tickets.length === 0 && (
                                            <div className="text-center py-16 text-gray-600">
                                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                                <p className="text-gray-400">No support tickets found</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Service Add/Edit Modal ── */}
            {showServiceForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                            <h2 className="text-lg font-bold text-white">
                                {editingService ? 'Edit Service' : 'Add New Service'}
                            </h2>
                            <button onClick={closeServiceForm} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleServiceSave} className="p-6 space-y-4">
                            {/* Service type selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Service Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {SERVICE_TYPES.map(t => (
                                        <button key={t.value} type="button" onClick={() => setServiceForm(f => ({ ...f, type: t.value }))}
                                            className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${serviceForm.type === t.value ? 'bg-red-600/20 border-red-500/50 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'}`}>
                                            <t.icon className={`w-4 h-4 ${t.color}`} />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Name *</label>
                                <input type="text" required value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder={`Enter ${selectedTypeInfo?.label} name`}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input type="tel" required value={serviceForm.phone} onChange={e => setServiceForm(f => ({ ...f, phone: e.target.value }))}
                                        placeholder="Phone number"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Email <span className="text-gray-500 font-normal">(optional)</span></label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input type="email" value={serviceForm.email} onChange={e => setServiceForm(f => ({ ...f, email: e.target.value }))}
                                        placeholder="Email address"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors" />
                                </div>
                            </div>

                            {/* Location – map picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Location
                                    {selectedTypeInfo?.hasLocation
                                        ? <span className="text-red-400"> *</span>
                                        : <span className="text-gray-500 font-normal"> (optional)</span>}
                                </label>
                                {serviceForm.latitude && serviceForm.longitude ? (
                                    <div className="flex items-start gap-3 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3">
                                        <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white line-clamp-2">{serviceForm.address || `${parseFloat(serviceForm.latitude).toFixed(5)}, ${parseFloat(serviceForm.longitude).toFixed(5)}`}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{parseFloat(serviceForm.latitude).toFixed(5)}, {parseFloat(serviceForm.longitude).toFixed(5)}</p>
                                        </div>
                                        <button type="button" onClick={() => setShowMapPicker(true)}
                                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0">
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setShowMapPicker(true)}
                                        className="w-full flex items-center justify-center gap-2 py-7 border-2 border-dashed border-gray-700 hover:border-red-500/50 rounded-xl text-gray-400 hover:text-red-400 transition-all">
                                        <MapPin className="w-5 h-5" />
                                        <span className="text-sm font-medium">Search or pick on map</span>
                                    </button>
                                )}
                            </div>


                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeServiceForm}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={serviceSaving}
                                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-sm text-white font-medium transition-all shadow-lg shadow-red-500/20 disabled:opacity-60">
                                    {serviceSaving ? 'Saving...' : editingService ? 'Update Service' : 'Add Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Map Picker Overlay ── */}
            {showMapPicker && (
                <LocationPickerMap
                    value={{
                        latitude: serviceForm.latitude ? parseFloat(serviceForm.latitude) : null,
                        longitude: serviceForm.longitude ? parseFloat(serviceForm.longitude) : null,
                        address: serviceForm.address,
                    }}
                    onChange={({ latitude, longitude, address }) =>
                        setServiceForm(f => ({
                            ...f,
                            latitude: latitude.toString(),
                            longitude: longitude.toString(),
                            address,
                        }))
                    }
                    onClose={() => setShowMapPicker(false)}
                />
            )}
        </div>
    );
}
