import React, { useState } from 'react';
import './VehicleTypeManager.css';

const VehicleTypeManager = ({ onClose, onVehicleTypeAdded }) => {
  const [newType, setNewType] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = '1234';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newType.trim()) {
      setError('Vehicle type name is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/vehicle-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)}`
        },
        body: JSON.stringify({ type_name: newType })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add vehicle type');
      }

      setSuccess(`Vehicle type "${newType}" added successfully`);
      setNewType('');
      if (onVehicleTypeAdded) {
        onVehicleTypeAdded();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vehicle-type-manager">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New Vehicle Type</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <p className="info-text">
            Note: After adding a new vehicle type, you'll need to:
            <ol>
              <li>Implement its calculation function in getEnergy.py</li>
              <li>Update the engine type mapping in the upload parameters logic</li>
              <li>Upload parameter files that use the new type</li>
            </ol>
          </p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="type-name">Vehicle Type Name:</label>
              <input
                id="type-name"
                type="text"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="e.g., PHEV"
                className="type-input"
                disabled={loading}
              />
            </div>

            <div className="button-group">
              <button 
                type="submit" 
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Vehicle Type'}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VehicleTypeManager;