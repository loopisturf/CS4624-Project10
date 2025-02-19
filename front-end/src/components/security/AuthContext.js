import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);  // Add loading state

  // Load authentication state from localStorage when the app starts
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedIsAdmin = localStorage.getItem('isAdmin') === 'true';

    if (storedUsername) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
      setIsAdmin(storedIsAdmin);
      console.log("Loaded from localStorage:", { storedUsername, storedIsAdmin });
    }
    setIsLoading(false);  // Mark loading as complete
  }, []);

  const login = (user, adminStatus) => {
    localStorage.setItem('username', user);
    localStorage.setItem('isAdmin', adminStatus ? 'true' : 'false');
    setIsAuthenticated(true);
    setUsername(user);
    setIsAdmin(adminStatus);
    console.log("Login state updated:", { user, adminStatus });
  };

  const logout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('isAdmin');
    setIsAuthenticated(false);
    setUsername(null);
    setIsAdmin(false);
    console.log("User logged out");
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        username, 
        isAdmin, 
        login, 
        logout,
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};