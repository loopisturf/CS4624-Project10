import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DownloadButton from '../../collections/DownloadButton';
import './AdminCollections.css';

// SVG Icons
const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3V21H21M9 15L13 11L17 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function AdminCollections() {
    const [collections, setCollections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const username = searchParams.get('username');
  
    useEffect(() => {
      const fetchCollections = async () => {
        try {
          const response = await fetch(`/api/collections/${username}`);
          if (response.ok) {
            const data = await response.json();
            setCollections(data);
          }
        } catch (error) {
          console.error('Error fetching collections:', error);
        } finally {
          setIsLoading(false);
        }
      };
  
      if (username) {
        fetchCollections();
      }
    }, [username]);
  
    if (isLoading) {
      return <div className="loading">Loading collections...</div>;
    }
  
    return (
      <div className="admin-collections-page">
        <div className="collections-header">
          <button 
            className="back-button"
            onClick={() => navigate('/admin/users')}
          >
            <BackIcon />
            Back to Users
          </button>
          <h2>Collections for <span className="username">{username}</span></h2>
          <p>{collections.length} Collections</p>
        </div>
  
        <div className="collections-grid">
          {collections.map(collection => (
            <div key={collection.id} className="collection-card">
              {collection.image_url && (
                <div className="collection-image">
                  <img src={collection.image_url} alt={collection.name} />
                </div>
              )}
              <div className="collection-content">
                <h3>{collection.name}</h3>
                <p className="collection-date">
                  Created: {new Date(collection.created_at).toLocaleDateString()}
                </p>
                <div className="action-buttons">
                  <button 
                    className="btn-primary"
                    onClick={() => navigate(`/body/${collection.id}`)}
                  >
                    <ChartIcon />
                    View Analysis
                  </button>
                  <DownloadButton collectionId={collection.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  export default AdminCollections;