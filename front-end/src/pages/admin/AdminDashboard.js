import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

// SVG Icons
const CollectionsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M16 2V6M8 2V6M3 10H21M8 14H16M8 18H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2"/>
    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M23 21V19C22.9986 17.1771 21.765 15.5857 20 15.13M16 3.13C17.7699 3.58317 19.0078 5.17799 19.0078 7.005C19.0078 8.83201 17.7699 10.4268 16 10.88" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const VehicleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 17H2V19H7V17Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M22 17H17V19H22V17Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M14 7H10L8 12H16L14 7Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M3 17H21V13L18 8H6L3 13V17Z" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p>Manage collections, users, and vehicle parameters</p>
        </div>
      </div> 

      <div className="admin-grid">
        <div className="admin-card" onClick={() => navigate('/collections')}>
          <div className="admin-card-content">
            <div className="admin-card-icon">
              <CollectionsIcon />
            </div>
            <h3>Admin Collections</h3>
            <p>Review and create collections.</p>
          </div>
        </div>

        <div className="admin-card" onClick={() => navigate('/admin/users')}>
          <div className="admin-card-content">
            <div className="admin-card-icon">
              <UsersIcon />
            </div>
            <h3>User Management</h3>
            <p>View users, manage permissions, and monitor collection activities across all accounts.</p>
          </div>
        </div>

        <div className="admin-card" onClick={() => navigate('/admin/vehicles')}>
          <div className="admin-card-content">
            <div className="admin-card-icon">
              <VehicleIcon />
            </div>
            <h3>Vehicle Parameters</h3>
            <p>Upload and configure vehicle parameters.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;