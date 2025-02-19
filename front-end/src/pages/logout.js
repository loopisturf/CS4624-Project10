import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../components/security/AuthContext.js'; // Ensure correct import

function LogoutPage() {
  const { logout } = useContext(AuthContext); // Get logout function from AuthContext
  const navigate = useNavigate();

  useEffect(() => {
    logout(); // Clear authentication state
    navigate('/'); // Redirect to login page after logout
  }, [logout, navigate]);

  return (
    <div>
      <h2>Logging out...</h2>
    </div>
  );
}

export default LogoutPage;
