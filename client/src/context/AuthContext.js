import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('customer');
        
        // Check if storedUser exists and is not "undefined" string
        if (storedToken && storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('customer');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = (userData, authToken) => {
    if (userData && authToken) {
      setUser(userData);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      localStorage.setItem('customer', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('customer');
  };

  const updateUser = (userData) => {
    if (userData) {
      setUser(userData);
      localStorage.setItem('customer', JSON.stringify(userData));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser, isAuthenticated: !!user && !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;