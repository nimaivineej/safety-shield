import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { authService } from '../../services/auth.service';

export function ResetPasswordScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    
    // Support a volunteer theme if ?role=volunteer is present
    const isVolunteer = searchParams.get('role') === 'volunteer';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const theme = isVolunteer
        ? {
            gradient: 'from-green-50 to-teal-50',
            iconBg: 'from-green-600 to-teal-500',
            accent: 'text-green-600 hover:text-green-700',
            inputFocus: 'focus:border-green-500',
            btnClass: 'bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600',
            successIconColor: 'text-green-500',
            backPath: '/volunteer-login',
        }
        : {
            gradient: 'from-purple-50 to-blue-50',
            iconBg: 'from-purple-600 to-blue-500',
            accent: 'text-purple-600 hover:text-purple-700',
            inputFocus: 'focus:border-purple-500',
            btnClass: 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600',
            successIconColor: 'text-purple-500',
            backPath: '/login',
        };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!token) {
            setError('Invalid or missing reset token.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword(token, password);
            setSuccess(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex flex-col`}>
            <div className="flex-1 flex flex-col p-6">

                {/* Back button */}
                <button
                    onClick={() => navigate(theme.backPath)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors w-fit mt-4"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Back to Login</span>
                </button>

                {/* Logo */}
                <div className="flex items-center justify-center mt-8 mb-8">
                    <div className={`w-20 h-20 bg-gradient-to-br ${theme.iconBg} rounded-full flex items-center justify-center shadow-lg`}>
                        <Shield className="w-10 h-10 text-white" strokeWidth={2.5} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">

                    {success ? (
                        /* ── Success state ── */
                        <div className="text-center space-y-6 bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
                            <div className="flex justify-center">
                                <div className={`w-20 h-20 bg-gradient-to-br ${theme.gradient} rounded-full flex items-center justify-center`}>
                                    <CheckCircle className={`w-10 h-10 ${theme.successIconColor}`} />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful</h2>
                                <p className="text-gray-600">
                                    Your password has been successfully updated. You can now securely log in to your account.
                                </p>
                            </div>
                            <Button
                                onClick={() => navigate(theme.backPath)}
                                className={`w-full h-14 rounded-2xl ${theme.btnClass} text-white text-base font-semibold shadow-lg`}
                            >
                                Continue to Login
                            </Button>
                        </div>
                    ) : (
                        /* ── Reset form ── */
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Password</h2>
                                <p className="text-gray-600">Create a secure password to access your account.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                                        <p className="text-sm text-red-600 text-center">{error}</p>
                                    </div>
                                )}

                                {!token && !error && (
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
                                        <p className="text-sm text-red-600 text-center font-medium">
                                            No reset token found in the link. Please request a new password reset email.
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="New Password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`pl-12 pr-12 h-14 rounded-2xl bg-white border-gray-200 ${theme.inputFocus}`}
                                            required
                                            minLength={6}
                                            disabled={loading || !token}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            disabled={loading || !token}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Confirm New Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className={`pl-12 h-14 rounded-2xl bg-white border-gray-200 ${theme.inputFocus}`}
                                            required
                                            minLength={6}
                                            disabled={loading || !token}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading || !token}
                                    className={`w-full h-14 rounded-2xl ${theme.btnClass} text-white mt-4 text-base font-semibold shadow-lg disabled:opacity-50`}
                                >
                                    {loading ? 'Resetting Password...' : 'Reset Password'}
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
