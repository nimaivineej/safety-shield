import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Heart } from 'lucide-react';
import { authService } from '../../services/auth.service';

export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (authService.isAuthenticated()) {
        const user = authService.getCurrentUser();
        if (user?.role === 'ADMIN') {
          navigate('/admin-dashboard');
        } else {
          navigate('/home');
        }
      } else {
        navigate('/login-selection');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-blue-500 flex flex-col items-center justify-center p-6">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="relative">
          <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl">
            <Shield className="w-16 h-16 text-purple-600" strokeWidth={2.5} />
          </div>
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">SafetyShield</h1>
          <p className="text-xl text-white/90">Your Safety, Our Priority</p>
        </div>

        <div className="mt-12">
          <div className="w-16 h-1 bg-white/50 rounded-full mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
