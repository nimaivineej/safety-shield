import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Mail, Lock, Eye, EyeOff, User, Phone, Building, Hash } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { authService } from '../../services/auth.service';

export function AuthorityRegisterScreen() {
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
        badgeNumber: '',
        department: '',
        designation: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

        if (!formData.badgeNumber) {
            setError('Badge number is required for authority registration');
            setLoading(false);
            return;
        }

        try {
            // Register as authority (will need admin approval)
            const response = await authService.registerAuthority({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
            });

            console.log('✅ Authority registration submitted:', response);

            // Show success message
            alert('Registration submitted! Your account will be activated after admin verification. You will receive an email once approved.');
            navigate('/authority-login');
        } catch (err: any) {
            console.error('❌ Registration failed:', err);
            const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
            <div className="flex-1 flex flex-col p-6">
                <div className="flex items-center justify-center mt-8 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-700 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                        <BadgeCheck className="w-8 h-8 text-white" strokeWidth={2.5} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Authority Registration</h2>
                        <p className="text-gray-600 text-sm">Register for official access (requires verification)</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-3">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                            <p className="text-xs text-blue-700">
                                ⚠️ Your account will be verified by admin before activation
                            </p>
                        </div>

                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                name="name"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                                className="pl-11 h-12 rounded-xl border-gray-200 focus:border-blue-500"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="email"
                                name="email"
                                placeholder="Official Email"
                                value={formData.email}
                                onChange={handleChange}
                                className="pl-11 h-12 rounded-xl border-gray-200 focus:border-blue-500"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="tel"
                                name="phone"
                                placeholder="Official Phone Number"
                                value={formData.phone}
                                onChange={handleChange}
                                className="pl-11 h-12 rounded-xl border-gray-200 focus:border-blue-500"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                name="badgeNumber"
                                placeholder="Badge/ID Number"
                                value={formData.badgeNumber}
                                onChange={handleChange}
                                className="pl-11 h-12 rounded-xl border-gray-200 focus:border-blue-500"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                className="w-full pl-11 h-12 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white text-gray-900"
                                required
                                disabled={loading}
                            >
                                <option value="">Select Department</option>
                                <option value="police">Police Department</option>
                                <option value="emergency">Emergency Services</option>
                                <option value="fire">Fire Department</option>
                                <option value="medical">Medical Services</option>
                                <option value="admin">Administration</option>
                            </select>
                        </div>

                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                name="designation"
                                placeholder="Designation/Rank"
                                value={formData.designation}
                                onChange={handleChange}
                                className="pl-11 h-12 rounded-xl border-gray-200 focus:border-blue-500"
                                required
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
                                className="pl-11 pr-11 h-12 rounded-xl border-gray-200 focus:border-blue-500"
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
                                className="pl-11 h-12 rounded-xl border-gray-200 focus:border-blue-500"
                                required
                                disabled={loading}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 hover:from-blue-800 hover:to-indigo-700 text-white text-base shadow-lg disabled:opacity-50"
                        >
                            {loading ? 'Submitting...' : 'Submit Registration'}
                        </Button>
                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600">
                            Already verified?{' '}
                            <button
                                onClick={() => navigate('/authority-login')}
                                className="text-blue-600 font-semibold hover:text-blue-700"
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
