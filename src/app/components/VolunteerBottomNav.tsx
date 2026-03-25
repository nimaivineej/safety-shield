import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Map, User } from 'lucide-react';

const NAV_ITEMS = [
    { icon: Users, label: 'Dashboard', path: '/volunteer-dashboard' },
    { icon: Map, label: 'Map', path: '/volunteer-map' },
    { icon: User, label: 'Profile', path: '/volunteer-profile' },
];

/**
 * Volunteer bottom navigation bar.
 * @param inline  When true, renders as a normal flow element (use inside flex columns
 *                like the map screen so Leaflet can't cover it). Defaults to false = fixed.
 */
export function VolunteerBottomNav({ inline = false }: { inline?: boolean }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const wrapperClass = inline
        ? 'w-full bg-white border-t border-gray-200 shadow-lg flex-none'
        : 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50';

    return (
        <div className={wrapperClass}>
            <div className="max-w-md mx-auto flex items-center justify-around h-16">
                {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
                    const active = pathname === path;
                    return (
                        <button
                            key={path}
                            onClick={() => navigate(path)}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${active ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                            <span className="text-xs mt-1">{label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
