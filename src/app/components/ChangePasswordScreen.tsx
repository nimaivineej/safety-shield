import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { authService } from '../../services/auth.service';
import api from '../../services/api';
import { API_ENDPOINTS } from '../../config/api.config';
export function ChangePasswordScreen() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const isVolunteer = user?.role === 'VOLUNTEER';
    const backPath = isVolunteer ? '/volunteer-profile' : '/profile';
    
    // Theme constants
    const primaryGradient = isVolunteer ? 'from-green-600 to-teal-500' : 'from-purple-600 to-blue-500';
    const primaryButton = isVolunteer ? 'from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600' : 'from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600';
    const screenBg = isVolunteer ? 'from-green-50 via-white to-teal-50' : 'from-purple-50 via-white to-blue-50';
    const primaryFocus = isVolunteer ? 'focus:border-green-500' : 'focus:border-purple-500';

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await api.put('/users/change-password', { currentPassword, newPassword });
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to change password. Please check your current password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br ${screenBg}`}>
            {/* Header */}
            <div className={`bg-gradient-to-r ${primaryGradient} text-white p-6`}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(backPath)}
                        className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Change Password</h1>
                        <p className="text-purple-100">Update your account password</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {success ? (
                    <div className="bg-white rounded-3xl shadow-lg p-8 text-center space-y-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Password Changed!</h2>
                        <p className="text-gray-600">Your password has been updated successfully.</p>
                        <Button
                            onClick={() => navigate(backPath)}
                            className={`w-full h-14 rounded-2xl bg-gradient-to-r ${primaryButton}`}
                        >
                            Back to Profile
                        </Button>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-lg p-6 space-y-4">
                        {error && (
                            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                                <p className="text-sm text-red-600 text-center">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Current Password */}
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    type={showCurrent ? 'text' : 'password'}
                                    placeholder="Current Password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="pl-12 pr-12 h-14 rounded-2xl bg-gray-50 border-gray-200 focus:border-purple-500"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* New Password */}
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    type={showNew ? 'text' : 'password'}
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="pl-12 pr-12 h-14 rounded-2xl bg-gray-50 border-gray-200 focus:border-purple-500"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Confirm Password */}
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    type={showNew ? 'text' : 'password'}
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-12 h-14 rounded-2xl bg-gray-50 border-gray-200 focus:border-purple-500"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className={`w-full h-14 rounded-2xl bg-gradient-to-r ${primaryButton} text-white font-semibold shadow-lg disabled:opacity-50 mt-2`}
                            >
                                {loading ? 'Updating Password...' : 'Update Password'}
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
