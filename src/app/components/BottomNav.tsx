import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Map, Bell, User, Users, Shield } from 'lucide-react';
import { authService } from '../../services/auth.service';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = authService.getCurrentUser();
  const isVolunteer = user?.role === 'VOLUNTEER';

  const navItems = isVolunteer ? [
    { icon: Users, label: 'Dashboard', path: '/volunteer-dashboard' },
    { icon: Map, label: 'Map', path: '/volunteer-map' },
    { icon: User, label: 'Profile', path: '/volunteer-profile' },
  ] : [
    { icon: Home, label: 'Home', path: '/home' },
    { icon: Map, label: 'Map', path: '/safe-route' },
    { icon: Bell, label: 'Alerts', path: '/alerts' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const activeColor = isVolunteer ? 'text-green-600' : 'text-purple-600';

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? activeColor : 'text-gray-400'
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
