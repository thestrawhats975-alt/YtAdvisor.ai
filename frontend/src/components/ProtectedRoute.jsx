import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // Show a tactical loading screen while verifying backend session constraints
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center space-y-4">
        <div className="font-mono text-xs text-[#FF0000]/60 uppercase tracking-widest animate-pulse">
            Verifying Encrypted Session...
        </div>
        <div className="flex gap-2">
            <div className="w-2 h-2 bg-[#FF0000] rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-[#FF0000] rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-[#FF0000] rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated breaches straight to the login terminal
    return <Navigate to="/login" replace />;
  }

  // Authorised clearance: render the child routes securely
  return <Outlet />;
};

export default ProtectedRoute;
