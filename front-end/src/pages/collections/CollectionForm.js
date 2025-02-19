import React, { useState, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../components/security/AuthContext.js';
import './CollectionForm.css';

const CollectionForm = ({ 
  initialData = { name: '', description: '' },
  mode = 'create',
  onSubmit,
  collectionId
}) => {
  const { username } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState(initialData);
  const [speedProfile, setSpeedProfile] = useState(null);
  const [collectionImage, setCollectionImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(initialData.image_url || null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Collection name is required';
    }
    if (mode === 'create' && !speedProfile) {
      newErrors.file = 'Speed profile file is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.csv';
    input.onchange = (e) => {
      if (e.target.files[0]) {
        handleFileChange(e.target.files[0]);
      }
    };
    input.click();
  };

  const handleFileChange = (file) => {
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, file: 'File size should be less than 5MB' }));
      return;
    }
    
    if (!file.name.toLowerCase().endsWith('.txt') && !file.name.toLowerCase().endsWith('.csv')) {
      setErrors(prev => ({ ...prev, file: 'Only .txt and .csv files are allowed' }));
      return;
    }
    
    setSpeedProfile(file);
    setFileName(file.name);
    setErrors(prev => ({ ...prev, file: '' }));
  };

  const handleImageChange = (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image size should be less than 5MB' }));
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Please upload a valid image file (JPEG, PNG, or GIF)' }));
      return;
    }

    setCollectionImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    setErrors(prev => ({ ...prev, image: '' }));
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileChange(file);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const submitData = new FormData();
    if (speedProfile) {
      submitData.append('file', speedProfile);
    }
    submitData.append('username', username);
    submitData.append('name', formData.name);
    submitData.append('description', formData.description);
    if (collectionImage) {
      submitData.append('image', collectionImage);
    }

    try {
      const result = await onSubmit(submitData);
      navigate(result.redirectUrl);
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        submit: error.message || 'Failed to save collection. Please try again.' 
      }));
      setLoading(false);
    }
  };

  return (
    <div className="collection-form-container">
      <div className="collection-form">
        <div className="form-header">
          <h2>Create New Collection</h2>
          <p className="subtitle">Upload a speed profile to analyze vehicle energy consumption</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-content">
            <div className="form-left">
              <div className="form-group">
                <label htmlFor="name">Collection Name *</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Speed Profile *</label>
                <div 
                  className="file-drop-zone"
                  onClick={handleFileClick}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {fileName ? (
                    <div className="file-info">
                      <span className="file-name">{fileName}</span>
                      <button 
                        type="button"
                        className="remove-file"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSpeedProfile(null);
                          setFileName('');
                        }}
                      >
                        Change File
                      </button>
                    </div>
                  ) : (
                    <div className="upload-prompt">
                      <div className="upload-icon">↑</div>
                      <div>Choose file or drag here</div>
                      <div className="file-hint">.txt or .csv, max 5MB</div>
                    </div>
                  )}
                </div>
                {errors.file && <span className="error-message">{errors.file}</span>}
              </div>
            </div>

            <div className="form-right">
              <div className="form-group">
                <label>Collection Image</label>
                <div 
                  className="image-upload-area"
                  onClick={() => document.getElementById('collectionImage').click()}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                      <button 
                        type="button"
                        className="change-image-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Change Image
                      </button>
                    </>
                  ) : (
                    <div className="image-placeholder">
                      <span>Click to add image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    id="collectionImage"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={(e) => handleImageChange(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="error-banner">{errors.submit}</div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/collections')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CollectionForm;