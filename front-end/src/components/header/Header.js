import './Header.css';
import '../Dropdown.css';
import Hamburger from 'hamburger-react';
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UserIcon from '../UserIcon.js';
import { AuthContext } from '../security/AuthContext.js';

function Header({ setSidebarOpen, isSidebarOpen }) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const { isAuthenticated, isAdmin, username, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = async (path) => {
    setDropdownOpen(false);
    if (path === '/logout') {
      await logout();
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  // Logo click - admins go to dashboard, regular users go home
  const homePath = isAdmin ? '/admin/dashboard' : '/';

  return (
    <header>
      <div className="header-container">
        <Hamburger toggled={isSidebarOpen} toggle={setSidebarOpen} />
        <div onClick={() => handleNavigation(homePath)} style={{ cursor: 'pointer' }}>
          <img src="/images/logo.png" className="logo" alt="logo" />
        </div>
        <h1 className="title">Automated Vehicles Fuel/Energy Estimation</h1>
        {isAuthenticated && (
          <div 
            className="user-icon-container" 
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <UserIcon fillColor="white" strokeColor="white" className="user-icon" alt="user icon"/>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                {isAdmin ? (
                  <>
                    <button onClick={() => handleNavigation('/admin/dashboard')}>Dashboard</button>
                    <button onClick={() => handleNavigation('/collections')}>My Collections</button>
                    <button onClick={() => handleNavigation('/admin/vehicles')}>Vehicle Params</button>
                    <button onClick={() => handleNavigation('/admin/users')}>User Management</button>
                    <button onClick={() => handleNavigation('/logout')}>Logout</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleNavigation('/collections')}>Collections</button>
                    <button onClick={() => handleNavigation('/')}>Home Page</button>
                    <button onClick={() => handleNavigation('/logout')}>Logout</button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;