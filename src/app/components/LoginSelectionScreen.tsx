import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users } from 'lucide-react';
import { Button } from './ui/button';

export function LoginSelectionScreen() {
    const navigate = useNavigate();

    const loginOptions = [
        {
            title: 'User Login',
            description: 'For general users seeking safety',
            icon: Shield,
            color: 'from-purple-600 to-blue-500',
            hoverColor: 'from-purple-700 to-blue-600',
            path: '/login',
        },
        {
            title: 'Volunteer Login',
            description: 'For community volunteers',
            icon: Users,
            color: 'from-green-600 to-teal-500',
            hoverColor: 'from-green-700 to-teal-600',
            path: '/volunteer-login',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
            <div className="flex-1 flex flex-col p-6">
                <div className="flex items-center justify-center mt-12 mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <Shield className="w-10 h-10 text-white" strokeWidth={2.5} />
                    </div>
                </div>

                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">SafetyShield</h2>
                        <p className="text-gray-600">Select your login type</p>
                    </div>

                    <div className="space-y-4">
                        {loginOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.path}
                                    onClick={() => navigate(option.path)}
                                    className="w-full p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-gray-200 group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 bg-gradient-to-br ${option.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                            <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <h3 className="text-lg font-semibold text-gray-900">{option.title}</h3>
                                            <p className="text-sm text-gray-600">{option.description}</p>
                                        </div>
                                        <svg
                                            className="w-6 h-6 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-gray-600">
                            Don't have an account?{' '}
                            <button
                                onClick={() => navigate('/register')}
                                className="text-purple-600 font-semibold hover:text-purple-700"
                            >
                                Sign Up
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
