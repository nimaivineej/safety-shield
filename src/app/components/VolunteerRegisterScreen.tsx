import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { authService } from '../../services/auth.service';

export function VolunteerRegisterScreen() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        address: '',
        skills: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.phone.length !== 10 || !/^\d+$/.test(formData.phone)) {
            setError('Phone number must be exactly 10 digits');
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        try {
            // Register as volunteer
            const response = await authService.registerVolunteer({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
            });

            console.log('✅ Volunteer registration successful:', response);

            // Show success message
            alert('Registration successful! Please check your email to verify your account.');
            navigate('/volunteer-login');
        } catch (err: any) {
            console.error('❌ Registration failed:', err);
            const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex flex-col">
            <div className="flex-1 flex flex-col p-6">
                <div className="flex items-center justify-center mt-8 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                        <Users className="w-8 h-8 text-white" strokeWidth={2.5} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Become a Volunteer</h2>
                        <p className="text-gray-600 text-sm">Join our community and help keep people safe</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-3">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                className="pl-11 h-12 rounded-xl border-gray-200 focus:border-green-500"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                className="pl-11 h-12 rounded-xl border-gray-200 focus:border-green-500"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="tel"
                                name="phone"
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={handleChange}
                                className="pl-11 h-12 rounded-xl border-gray-200 focus:border-green-500"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                name="address"
                                placeholder="Address (Optional)"
                                value={formData.address}
                                onChange={handleChange}
                                className="pl-11 h-12 rounded-xl border-gray-200 focus:border-green-500"
                                disabled={loading}
                            />
                        </div>

                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                name="skills"
                                placeholder="Skills (e.g., First Aid, Driving)"
                                value={formData.skills}
                                onChange={handleChange}
                                className="pl-11 h-12 rounded-xl border-gray-200 focus:border-green-500"
                                disabled={loading}
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Password (min 8 characters)"
                                value={formData.password}
                                onChange={handleChange}
                                className="pl-11 pr-11 h-12 rounded-xl border-gray-200 focus:border-green-500"
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

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="pl-11 h-12 rounded-xl border-gray-200 focus:border-green-500"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                            <p className="text-xs text-green-700">
                                ✓ By registering, you agree to help community members in emergencies
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600 text-white text-base shadow-lg disabled:opacity-50"
                        >
                            {loading ? 'Creating Account...' : 'Register as Volunteer'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <button
                                onClick={() => navigate('/volunteer-login')}
                                className="text-green-600 font-semibold hover:text-green-700"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
