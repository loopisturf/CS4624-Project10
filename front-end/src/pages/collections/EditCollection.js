import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CollectionForm from './CollectionForm';

function EditCollection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        const response = await fetch(`/api/collections/${id}`);
        if (!response.ok) throw new Error('Collection not found');
        const data = await response.json();
        setCollection(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [id]);

  const handleSubmit = async (formData) => {
    const response = await fetch(`/api/collections/${id}`, {
      method: 'PUT',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to update collection');
    }

    return { redirectUrl: '/collections' };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">Error: {error}</div>
        <button 
          className="btn-secondary"
          onClick={() => navigate('/collections')}
        >
          Back to Collections
        </button>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="not-found-container">
        <div className="not-found">Collection not found</div>
        <button 
          className="btn-secondary"
          onClick={() => navigate('/collections')}
        >
          Back to Collections
        </button>
      </div>
    );
  }

  return (
    <CollectionForm
      initialData={{
        name: collection.name,
        description: collection.description,
        image_url: collection.image_url,
      }}
      mode="edit"
      onSubmit={handleSubmit}
      collectionId={id}
    />
  );
}

export default EditCollection;