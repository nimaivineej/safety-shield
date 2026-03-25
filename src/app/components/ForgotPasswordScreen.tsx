import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, Users, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { authService } from '../../services/auth.service';

/**
 * Shared Forgot Password screen.
 * Pass ?role=volunteer to get the green volunteer theme; default is the purple user theme.
 */
export function ForgotPasswordScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isVolunteer = searchParams.get('role') === 'volunteer';

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    // Theme tokens
    const theme = isVolunteer
        ? {
            gradient: 'from-green-50 to-teal-50',
            iconBg: 'from-green-600 to-teal-500',
            accent: 'text-green-600 hover:text-green-700',
            inputFocus: 'focus:border-green-500',
            btnClass: 'bg-gradient-to-r from-green-600 to-teal-500 hover:from-green-700 hover:to-teal-600',
            successIconColor: 'text-green-500',
            backPath: '/volunteer-login',
            Icon: Users,
            title: 'Volunteer Password Reset',
            subtitle: "Enter your volunteer email and we'll send you a reset link.",
        }
        : {
            gradient: 'from-purple-50 to-blue-50',
            iconBg: 'from-purple-600 to-blue-500',
            accent: 'text-purple-600 hover:text-purple-700',
            inputFocus: 'focus:border-purple-500',
            btnClass: 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600',
            successIconColor: 'text-purple-500',
            backPath: '/login',
            Icon: Shield,
            title: 'Forgot Password?',
            subtitle: "Enter your email address and we'll send you a reset link.",
        };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authService.forgotPassword(email);
            setSent(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const { Icon } = theme;

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
                        <Icon className="w-10 h-10 text-white" strokeWidth={2.5} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">

                    {sent ? (
                        /* ── Success state ── */
                        <div className="text-center space-y-5">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                                    <CheckCircle className={`w-11 h-11 ${theme.successIconColor}`} />
                                </div>
                            </div>

                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    We've sent a password reset link to{' '}
                                    <span className="font-semibold text-gray-800">{email}</span>.
                                    Please check your inbox and spam folder.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl p-4 shadow-sm text-sm text-gray-500 space-y-1">
                                <p>⏱ The link expires in <span className="font-medium text-gray-700">15 minutes</span>.</p>
                                <p>📭 Didn't get the email? Check your spam folder first.</p>
                            </div>

                            <Button
                                onClick={() => { setSent(false); setEmail(''); }}
                                variant="outline"
                                className="w-full h-12 rounded-2xl border-gray-300 text-gray-700"
                            >
                                Resend Email
                            </Button>

                            <button
                                onClick={() => navigate(theme.backPath)}
                                className={`text-sm font-semibold ${theme.accent}`}
                            >
                                ← Return to Login
                            </button>
                        </div>
                    ) : (
                        /* ── Request form ── */
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">{theme.title}</h2>
                                <p className="text-gray-600">{theme.subtitle}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <Input
                                        type="email"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className={`pl-11 h-14 rounded-2xl border-gray-200 ${theme.inputFocus}`}
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full h-14 rounded-2xl ${theme.btnClass} text-white text-base font-semibold shadow-lg disabled:opacity-50`}
                                >
                                    {loading ? 'Sending Reset Link…' : 'Send Reset Link'}
                                </Button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className="text-gray-600 text-sm">
                                    Remembered your password?{' '}
                                    <button
                                        onClick={() => navigate(theme.backPath)}
                                        className={`font-semibold ${theme.accent}`}
                                    >
                                        Sign In
                                    </button>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
