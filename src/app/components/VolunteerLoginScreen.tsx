import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { authService } from '../../services/auth.service';

export function VolunteerLoginScreen() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authService.login({ email, password });

            // Check if user is actually a volunteer
            if (response.data.user.role !== 'VOLUNTEER') {
                setError('This login is only for volunteers. Please use the correct login page.');
                authService.logout();
                setLoading(false);
                return;
            }

            console.log('✅ Volunteer login successful:', response);
            navigate('/volunteer-dashboard');
        } catch (err: any) {
            console.error('❌ Login failed:', err);
            const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex flex-col">
            <div className="flex-1 flex flex-col p-6">
                <div className="flex items-center justify-center mt-12 mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                        <Users className="w-10 h-10 text-white" strokeWidth={2.5} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Volunteer Portal</h2>
                        <p className="text-gray-600">Sign in to help your community</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="email"
                                placeholder="Volunteer Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-11 h-14 rounded-2xl border-gray-200 focus:border-green-500"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-11 pr-11 h-14 rounded-2xl border-gray-200 focus:border-green-500"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="text-right">
                            <button type="button" onClick={() => navigate('/forgot-password?role=volunteer')} className="text-sm text-green-600 hover:text-green-700">
                                Forgot Password?
                            </button>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white text-lg shadow-lg disabled:opacity-50"
                        >
                            {loading ? 'Signing In...' : 'Sign In as Volunteer'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center space-y-3">
                        <p className="text-gray-600">
                            Not a volunteer?{' '}
                            <button
                                onClick={() => navigate('/login')}
                                className="text-green-600 font-semibold hover:text-green-700"
                            >
                                User Login
                            </button>
                        </p>
                        <p className="text-gray-600">
                            Want to become a volunteer?{' '}
                            <button
                                onClick={() => navigate('/volunteer-register')}
                                className="text-green-600 font-semibold hover:text-green-700"
                            >
                                Register Here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
