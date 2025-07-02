import React, { useState } from 'react';
import { History, ChevronLeft, Mail, AlertCircle, CheckCircle, Eye, EyeOff, Building, User, Lock, ArrowRight, UserCheck } from 'lucide-react';
import AnimatedBackground from './AnimatedBackground';
import { useAuth } from '../contexts/AuthContext';
import { AuthMode, SignInFormData, RegisterFormData } from '../types';

interface AuthPageProps {
  onBackToTopicSelection: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onBackToTopicSelection }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingUserEmail, setExistingUserEmail] = useState<string | null>(null);

  // Form data
  const [signInData, setSignInData] = useState<SignInFormData>({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    isOrganization: false,
    organizationName: '',
    organizationSlug: '',
    organizationDescription: ''
  });

  const { signInWithMagicLink, signInWithPassword, signUpWithPassword } = useAuth();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle email input
  const handleEmailChange = (email: string) => {
    if (mode === 'signin') {
      setSignInData(prev => ({ ...prev, email }));
    } else {
      setRegisterData(prev => ({ ...prev, email }));
    }
  };

  // Handle organization name change and auto-generate slug
  const handleOrganizationNameChange = (name: string) => {
    const slug = generateSlug(name);
    setRegisterData(prev => ({
      ...prev,
      organizationName: name,
      organizationSlug: slug
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateEmail(signInData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!signInData.password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signInWithPassword(signInData.email, signInData.password);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Successfully signed in!');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setExistingUserEmail(null);

    // Validation
    if (!validateEmail(registerData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(registerData.password)) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!registerData.fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (registerData.isOrganization) {
      if (!registerData.organizationName?.trim()) {
        setError('Please enter your organization name');
        return;
      }
      if (!registerData.organizationSlug?.trim()) {
        setError('Organization slug is required');
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await signUpWithPassword({
        email: registerData.email,
        password: registerData.password,
        confirmPassword: registerData.confirmPassword,
        fullName: registerData.fullName,
        isOrganization: registerData.isOrganization,
        organizationName: registerData.organizationName,
        organizationSlug: registerData.organizationSlug,
        organizationDescription: registerData.organizationDescription
      });

      if (result.userExists) {
        // User already exists - show welcome back message
        setExistingUserEmail(result.existingUserEmail || registerData.email);
        setError('');
        setSuccess('');
      } else if (result.error) {
        setError(result.error.message);
      } else {
        if (registerData.isOrganization) {
          setSuccess('Registration successful! Your organization registration is pending admin approval. You will be notified once approved.');
        } else {
          setSuccess('Registration successful! You can now sign in.');
        }
        setRegisterData({
          email: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          isOrganization: false,
          organizationName: '',
          organizationSlug: '',
          organizationDescription: ''
        });
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMagicLinkForExistingUser = async () => {
    if (!existingUserEmail) return;

    setIsLoading(true);
    try {
      const { error } = await signInWithMagicLink(existingUserEmail);
      if (error) {
        setError(error.message);
      } else {
        setSuccess('Magic link sent! Please check your email and click the link to sign in.');
        setExistingUserEmail(null);
      }
    } catch (err) {
      setError('Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToSignIn = () => {
    if (existingUserEmail) {
      setSignInData({ email: existingUserEmail, password: '' });
      setExistingUserEmail(null);
    }
    setMode('signin');
    setError('');
    setSuccess('');
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
                    {existingUserEmail ? 'Welcome Back!' : mode === 'signin' ? 'Sign In' : 'Create Account'}
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
            {/* Existing User Welcome Back */}
            {existingUserEmail && (
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
                <p className="text-gray-400 mb-6">
                  We found an existing account for <span className="text-blue-400 font-medium">{existingUserEmail}</span>
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={handleSendMagicLinkForExistingUser}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending Magic Link...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Mail className="w-5 h-5" />
                        <span>Send Magic Link</span>
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={handleSwitchToSignIn}
                    className="w-full py-3 px-4 bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600/50 hover:border-gray-500/50 rounded-xl text-gray-300 hover:text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      <span>Sign In with Password</span>
                    </div>
                  </button>
                </div>
                
                <p className="text-gray-500 text-sm mt-6">
                  Choose your preferred sign-in method to continue
                </p>
                
                {/* Error/Success Messages for existing user flow */}
                {error && (
                  <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <p className="text-green-400 text-sm">{success}</p>
                  </div>
                )}
                
                return;
              </div>
            )}

            {/* Mode Toggle */}
            {!existingUserEmail && (
              <div className="flex items-center gap-2 bg-gray-800/30 border border-gray-600/50 rounded-xl p-1 mb-8">
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    mode === 'signin'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    mode === 'register'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  Register
                </button>
              </div>
            )}

            {/* Title */}
            {!existingUserEmail && (
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {mode === 'signin' ? (
                    <Lock className="w-8 h-8 text-white" />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-400">
                  {mode === 'signin' 
                    ? 'Enter your credentials to continue'
                    : 'Join Timeline Explorer today'
                  }
                </p>
              </div>
            )}

            {/* Error/Success Messages */}
            {!existingUserEmail && error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {!existingUserEmail && success && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-400 text-sm">{success}</p>
              </div>
            )}

            {/* Sign In Form */}
            {!existingUserEmail && mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="signin-email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="signin-email"
                      value={signInData.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="signin-password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="signin-password"
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-12 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !signInData.email || !signInData.password}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            )}

            {/* Register Form */}
            {!existingUserEmail && mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="register-email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="register-email"
                      value={registerData.email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Full Name Field */}
                <div>
                  <label htmlFor="register-name" className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="register-name"
                      value={registerData.fullName}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                      className="w-full pl-10 pr-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="register-password" className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="register-password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Create a password (min 8 characters)"
                      className="w-full pl-10 pr-12 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="register-confirm-password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-12 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                      ) : (
                        <Eye className="w-5 h-5 text-gray-400 hover:text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Organization Toggle */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={registerData.isOrganization}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, isOrganization: e.target.checked }))}
                      className="w-5 h-5 text-blue-600 bg-gray-800/30 border-gray-600/50 rounded focus:ring-blue-500 focus:ring-2"
                      disabled={isLoading}
                    />
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-gray-400" />
                      <span className="text-sm text-gray-300">
                        Register as an organization
                      </span>
                    </div>
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    Organizations require admin approval before access is granted
                  </p>
                </div>

                {/* Organization Fields */}
                {registerData.isOrganization && (
                  <>
                    <div>
                      <label htmlFor="org-name" className="block text-sm font-medium text-gray-300 mb-2">
                        Organization Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          id="org-name"
                          value={registerData.organizationName}
                          onChange={(e) => handleOrganizationNameChange(e.target.value)}
                          placeholder="Enter organization name"
                          className="w-full pl-10 pr-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          required={registerData.isOrganization}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="org-slug" className="block text-sm font-medium text-gray-300 mb-2">
                        Organization Slug
                      </label>
                      <input
                        type="text"
                        id="org-slug"
                        value={registerData.organizationSlug}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, organizationSlug: e.target.value }))}
                        placeholder="organization-slug"
                        className="w-full px-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        required={registerData.isOrganization}
                        disabled={isLoading}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Used in URLs and must be unique
                      </p>
                    </div>

                    <div>
                      <label htmlFor="org-description" className="block text-sm font-medium text-gray-300 mb-2">
                        Organization Description (Optional)
                      </label>
                      <textarea
                        id="org-description"
                        value={registerData.organizationDescription}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, organizationDescription: e.target.value }))}
                        placeholder="Brief description of your organization"
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-800/30 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none"
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all duration-200 hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    registerData.isOrganization ? 'Register Organization' : 'Create Account'
                  )}
                </button>
              </form>
            )}

            {/* Info */}
            {!existingUserEmail && (
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  {mode === 'signin' 
                    ? 'All users sign in with email and password'
                    : 'Individual accounts are activated immediately, organizations require approval'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;