import React, { useState } from 'react';
import { History, ChevronLeft, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import { useAuth } from '../contexts/AuthContext';

interface AuthPageProps {
  onBackToTopicSelection: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onBackToTopicSelection }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const { signIn, signUp, resetPassword } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('Account created successfully! Please check your email to verify your account.');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
        // If successful, the auth context will handle the redirect
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Password reset email sent! Please check your inbox.');
        setShowResetPassword(false);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-30 border-b border-gray-800/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToTopicSelection}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg"
              aria-label="Go back to topic selection"
            >
              <ChevronLeft className="w-5 h-5 text-blue-400" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                  <History className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Timeline Explorer
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Admin Authentication
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/20 backdrop-blur-sm border border-gray-700/30 rounded-2xl p-8 shadow-2xl">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {showResetPassword ? 'Reset Password' : isSignUp ? 'Create Admin Account' : 'Admin Sign In'}
              </h2>
              <p className="text-gray-400">
                {showResetPassword 
                  ? 'Enter your email to receive a password reset link'
                  : isSignUp 
                    ? 'Create your admin account to manage timelines'
                    : 'Sign in to access the admin dashboard'
                }
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={showResetPassword ? handleResetPassword : handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              {!showResetPassword && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors duration-200"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password Field (Sign Up only) */}
              {isSignUp && !showResetPassword && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-12 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      required
                      disabled={isLoading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors duration-200"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>
                      {showResetPassword ? 'Sending...' : isSignUp ? 'Creating Account...' : 'Signing In...'}
                    </span>
                  </div>
                ) : (
                  showResetPassword ? 'Send Reset Email' : isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center space-y-3">
              {!showResetPassword && (
                <>
                  <button
                    onClick={toggleMode}
                    disabled={isLoading}
                    className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>

                  {!isSignUp && (
                    <div>
                      <button
                        onClick={() => setShowResetPassword(true)}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-gray-300 transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}
                </>
              )}

              {showResetPassword && (
                <button
                  onClick={() => setShowResetPassword(false)}
                  disabled={isLoading}
                  className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;