import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Primary protocol to verify the session via Backend HTTPOnly Cookie
  const checkAuthStatus = async () => {
    try {
      const baseUrl = import.meta.env.BACKEND_BASE_URL || '';
      
      // Ping the backend. Since the token is in an HttpOnly cookie, 
      // we must precisely include credentials to send cookies automatically over HTTPS/Proxy.
      const response = await fetch(`${baseUrl}/api/user/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // CRITICAL for securely reading HttpOnly cookies
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Neural uplink auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
