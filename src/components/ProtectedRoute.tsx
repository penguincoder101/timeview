import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthPage from './AuthPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onBackToTopicSelection: () => void;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, onBackToTopicSelection }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onBackToTopicSelection={onBackToTopicSelection} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;