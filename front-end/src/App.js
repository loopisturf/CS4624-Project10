import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/header/Header.js';
import Body from './pages/body/Body.js';
import LoginPage from './pages/login/Login';
import CollectionsPage from './pages/collections/CollectionsPage.js';
import WelcomePage from './pages/welcome/WelcomePage.js';
import SignUpPage from './pages/signup/Signup.js';
import { AuthProvider } from './components/security/AuthContext.js';
import ProtectedRoute from './components/security/ProtectedRoute.js';
import LogoutPage from './pages/logout.js';
import AdminDashboard from './pages/admin/AdminDashboard.js';
import AdminUsers from './pages/admin/users/AdminUsers.js';
import AdminCollections from './pages/admin/users/AdminCollections.js';
import Vehicles from './pages/admin/vehicle/Vehicles.js';
import CreateCollection from './pages/collections/CreateCollection.js';
import EditCollection from './pages/collections/EditCollection.js'; // Add this import
import './global.css';

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AuthProvider>
      <Router>
        <Header setSidebarOpen={setSidebarOpen} isSidebarOpen={isSidebarOpen} />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/" element={<WelcomePage />} />
          <Route path="/logout" element={<LogoutPage />} />

          {/* Protected User Routes */}
          <Route
            path="/body/:collectionId"
            element={
              <ProtectedRoute>
                <Body
                  isSidebarOpen={isSidebarOpen}
                  setSidebarOpen={setSidebarOpen}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections"
            element={
              <ProtectedRoute>
                <CollectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-collection"
            element={
              <ProtectedRoute>
                <CreateCollection />
              </ProtectedRoute>
            }
          />
          {/* Add Edit Collection Route */}
          <Route
            path="/edit-collection/:id"
            element={
              <ProtectedRoute>
                <EditCollection />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute adminRequired>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminRequired>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/user-collections"
            element={
              <ProtectedRoute adminRequired>
                <AdminCollections />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vehicles"
            element={
              <ProtectedRoute adminRequired>
                <Vehicles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/create-collection"
            element={
              <ProtectedRoute adminRequired>
                <CreateCollection />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;