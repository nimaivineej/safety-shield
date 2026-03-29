import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    User,
    Mail,
    Phone,
    Calendar,
    Shield,
    Star,
    CheckCircle,
    LogOut,
    Loader,
    Bell,
    Lock,
    HelpCircle,
    ChevronRight,
} from 'lucide-react';
import { Button } from './ui/button';
import { BottomNav } from './BottomNav';
import { authService } from '../../services/auth.service';
import { volunteerService } from '../../services/volunteer.service';

export function VolunteerProfileScreen() {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            navigate('/login-selection');
            return;
        }
        setUser(currentUser);

        // Load volunteer stats
        volunteerService.getVolunteerStats()
            .then((res) => setStats(res.data || res))
            .catch(() => setStats(null))
            .finally(() => setLoading(false));
    }, [navigate]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login-selection');
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-10 h-10 text-green-500 animate-spin" />
            </div>
        );
    }

    const settingsItems = [
        { icon: Bell, label: 'Notifications', description: 'Alert & availability settings', path: '/volunteer/notifications' },
        { icon: Lock, label: 'Privacy & Security', description: 'Manage your account security', path: '/volunteer/privacy-security' },
        { icon: HelpCircle, label: 'Help & Support', description: 'FAQs and contact support', path: '/volunteer/help-support' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 pb-20">

            {/* ── Hero Header ── */}
            <div className="bg-gradient-to-r from-green-600 to-teal-500 text-white px-6 pt-10 pb-10 rounded-b-3xl shadow-lg">
                <div className="text-center">
                    <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                        <User className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <p className="text-green-100 text-sm mt-1">Community Volunteer</p>

                    {/* Volunteer badge */}
                    <div className="inline-flex items-center gap-1.5 mt-3 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold">
                        <Shield className="w-4 h-4" />
                        SafetyShield Volunteer
                    </div>
                </div>
            </div>

            <div className="px-5 pt-5 space-y-4">

                {/* ── Stats Row ── */}
                {!loading && stats && (
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icon: CheckCircle, label: 'Completed', value: stats.completedIncidents ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
                            { icon: Star, label: 'Rating', value: stats.rating ? `${stats.rating.toFixed(1)}★` : 'N/A', color: 'text-amber-500', bg: 'bg-amber-50' },
                            { icon: Shield, label: 'Active', value: stats.activeIncidents ?? 0, color: 'text-teal-600', bg: 'bg-teal-50' },
                        ].map(({ icon: Icon, label, value, color, bg }) => (
                            <div key={label} className={`${bg} rounded-2xl p-3 text-center`}>
                                <Icon className={`w-6 h-6 ${color} mx-auto mb-1`} />
                                <p className="text-lg font-bold text-gray-900">{value}</p>
                                <p className="text-xs text-gray-500">{label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Personal Information ── */}
                <div className="bg-white rounded-3xl shadow-sm p-5 space-y-3">
                    <h2 className="text-base font-bold text-gray-900 mb-1">Personal Information</h2>

                    {[
                        { icon: Mail, label: 'Email', value: user.email, color: 'bg-green-100 text-green-600' },
                        { icon: Phone, label: 'Phone', value: user.phone || 'Not set', color: 'bg-teal-100 text-teal-600' },
                        { icon: Calendar, label: 'Member since', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A', color: 'bg-blue-100 text-blue-600' },
                    ].map(({ icon: Icon, label, value, color }) => (
                        <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                            <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">{label}</p>
                                <p className="font-medium text-gray-900 text-sm">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Settings ── */}
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                        <h2 className="text-base font-bold text-gray-900">Settings</h2>
                    </div>
                    {settingsItems.map((item, i) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer ${i !== settingsItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                            >
                                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-teal-100 rounded-xl flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                                    <p className="text-xs text-gray-500">{item.description}</p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </Link>
                        );
                    })}
                </div>

                {/* ── App info ── */}
                <div className="bg-green-50 rounded-2xl p-4 text-center">
                    <p className="text-sm text-green-900 font-semibold">SafetyShield Volunteer v1.0.0</p>
                    <p className="text-xs text-green-600 mt-0.5">Protecting communities together</p>
                </div>

                {/* ── Logout ── */}
                <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full h-14 rounded-2xl border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                >
                    <LogOut className="w-5 h-5 mr-2" />
                    Logout
                </Button>
            </div>

            <BottomNav />
        </div>
    );
}
