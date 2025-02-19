import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../components/security/AuthContext.js';
import './CollectionsPage.css';
import DownloadButton from './DownloadButton.js';

// SVG Icons as components
const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 3C17.2626 2.73735 17.5744 2.52901 17.9176 2.38687C18.2608 2.24473 18.6286 2.17157 19 2.17157C19.3714 2.17157 19.7392 2.24473 20.0824 2.38687C20.4256 2.52901 20.7374 2.73735 21 3C21.2626 3.26264 21.471 3.57444 21.6131 3.9176C21.7553 4.26077 21.8284 4.62856 21.8284 5C21.8284 5.37143 21.7553 5.73923 21.6131 6.08239C21.471 6.42555 21.2626 6.73735 21 7L7.5 20.5L2 22L3.5 16.5L17 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3V21H21M9 15L13 11L17 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CollectionCard = ({ collection, onDelete }) => {
  const navigate = useNavigate();
  const { username } = useContext(AuthContext);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/collections/${collection.id}?username=${username}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) throw new Error('Failed to delete collection');
      onDelete(collection.id);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to delete collection');
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="collection-card">
      {collection.image_url && (
        <div className="collection-image">
          <img src={collection.image_url} alt={collection.name} />
        </div>
      )}
      <div className="collection-content">
        <h3>{collection.name}</h3>
        {collection.description && (
          <p className="collection-description">{collection.description}</p>
        )}
        <p className="created-date">
          Created: {new Date(collection.created_at).toLocaleDateString()}
        </p>
        <div className="action-buttons">
          <button 
            className="btn-primary"
            onClick={() => navigate(`/body/${collection.id}`)}
          >
            <ChartIcon />
            Analyze
          </button>
          <DownloadButton collectionId={collection.id} />
          <button 
            className="btn-secondary"
            onClick={() => navigate(`/edit-collection/${collection.id}`)}
          >
            <PencilIcon />
            Edit
          </button>
          <button 
            className="btn-delete"
            onClick={() => setShowConfirm(true)}
            disabled={isDeleting}
          >
            <TrashIcon />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>

        {showConfirm && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm">
              <p>Are you sure you want to delete this collection?</p>
              <p className="delete-warning">This action cannot be undone.</p>
              <div className="confirm-buttons">
                <button 
                  className="btn-cancel" 
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-confirm" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function CollectionsPage() {
  const { username } = useContext(AuthContext);
  const [collections, setCollections] = useState([]);
  const navigate = useNavigate();

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
      }
    };
    fetchCollections();
  }, [username]);

  const handleDelete = (deletedId) => {
    setCollections(collections.filter(c => c.id !== deletedId));
  };

  return (
    <div className="collections-page">
      <div className="collections-header">
        <div>
          <h2>Collections for {username}</h2>
          <p>{collections.length} Collections</p>
        </div>
        <button 
          className="create-collection-button"
          onClick={() => navigate('/create-collection')}
        >
          <PencilIcon />
          Create Collection
        </button>
      </div>

      <div className="collections-grid">
        {collections.map(collection => (
          <CollectionCard 
            key={collection.id} 
            collection={collection} 
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default CollectionsPage;