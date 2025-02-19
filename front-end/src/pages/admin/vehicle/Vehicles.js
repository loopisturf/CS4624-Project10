import React, { useState, useEffect } from 'react';
import './Vehicles.css';

const Vehicles = () => {
  const [vehicleParams, setVehicleParams] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [newType, setNewType] = useState({
    abbreviation: '',
    fullName: '',
    engineId: ''
  });

  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = '1234';

  useEffect(() => {
    fetchVehicleParams();
    fetchVehicleTypes();
  }, []);

  const fetchVehicleParams = async () => {
    try {
      const response = await fetch('/api/vehicle-params');
      if (!response.ok) throw new Error('Failed to fetch vehicle parameters');
      const data = await response.json();
      setVehicleParams(data);
    } catch (err) {
      setError('Failed to load vehicle parameters');
      console.error(err);
    }
  };

  const fetchVehicleTypes = async () => {
    try {
      const response = await fetch('/api/vehicle-types');
      if (!response.ok) throw new Error('Failed to fetch vehicle types');
      const data = await response.json();
      setVehicleTypes(data);
    } catch (err) {
      console.error('Failed to load vehicle types:', err);
    }
  };

  const handleAddVehicleType = async (e) => {
    e.preventDefault();
    
    if (!newType.abbreviation || !newType.fullName || !newType.engineId) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/vehicle-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)}`
        },
        body: JSON.stringify({
          type_name: newType.abbreviation.toUpperCase(),
          full_name: newType.fullName,
          engine_id: parseInt(newType.engineId)
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add vehicle type');
      }

      setNewType({ abbreviation: '', fullName: '', engineId: '' });
      setShowTypeModal(false);
      await fetchVehicleTypes();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.txt') && !file.name.endsWith('.dat')) {
      setError('Please upload a .txt or .csv file');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Clear existing parameters
      const clearResponse = await fetch('/api/admin/clear-vehicle-params', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)}`
        }
      });

      if (!clearResponse.ok) {
        throw new Error('Failed to clear existing parameters');
      }

      // Upload new parameters
      const uploadResponse = await fetch('/api/admin/upload-vehicle-params', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)}`
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload parameters file');
      }

      await fetchVehicleParams();
      event.target.value = '';
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getColorClass = (index) => {
    const colorClasses = ["vt-purple", "vt-pink", "vt-orange", "vt-teal"];
    return colorClasses[index % colorClasses.length];
  };

  const renderVehicleTypesReference = () => (
    <div className="vehicle-types-reference">
      <div className="reference-header">
        <h3 className="subtitle">Available Vehicle Types</h3>
        <button 
          className="add-type-button"
          onClick={() => setShowTypeModal(true)}
        >
          Add New Vehicle Type
        </button>
      </div>
      <table className="reference-table">
        <thead>
          <tr>
            <th>Abbreviation</th>
            <th>Full Name</th>
            <th>Engine Type ID</th>
          </tr>
        </thead>
        <tbody>
          {vehicleTypes.map((type, index) => (
            <tr key={type.id}>
              <td>
                <div className={`type_name ${getColorClass(index)}`}>
                  {type.name}
                </div>
              </td>
              <td>{type.full_name}</td>
              <td>{type.engine_id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAddTypeModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Add New Vehicle Type</h3>
          <button className="close-button" onClick={() => setShowTypeModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <p className="info-text">
            After adding a new vehicle type, remember to:
            <ul>
              <li>Implement its calculation function in getEnergy.py</li>
              <li>Update the engine type mapping in the upload parameters logic</li>
              <li>Upload parameter files that use the new type</li>
            </ul>
          </p>
          <form onSubmit={handleAddVehicleType}>
            <div className="form-group">
              <label>Abbreviation:</label>
              <input
                type="text"
                value={newType.abbreviation}
                onChange={(e) => setNewType(prev => ({ 
                  ...prev, 
                  abbreviation: e.target.value 
                }))}
                placeholder="e.g., PHEV"
                className="type-input"
              />
            </div>
            <div className="form-group">
              <label>Full Name:</label>
              <input
                type="text"
                value={newType.fullName}
                onChange={(e) => setNewType(prev => ({ 
                  ...prev, 
                  fullName: e.target.value 
                }))}
                placeholder="e.g., Plug-in Hybrid Electric Vehicle"
                className="type-input"
              />
            </div>
            <div className="form-group">
              <label>Engine Type ID:</label>
              <input
                type="number"
                value={newType.engineId}
                onChange={(e) => setNewType(prev => ({ 
                  ...prev, 
                  engineId: e.target.value 
                }))}
                placeholder="e.g., 5"
                className="type-input"
              />
            </div>
            <div className="button-group">
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Adding...' : 'Add Type'}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowTypeModal(false);
                  setNewType({ abbreviation: '', fullName: '', engineId: '' });
                }}
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

  const renderTable = () => (
    <div className="table-container">
      <table className="vehicle-params-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Engine Type</th>
            <th>Type</th>
            <th>Mass (kg)</th>
            <th>Length (m)</th>
            <th>Mass Proportion</th>
            <th>Friction Coef.</th>
            <th>Engine Power (kW)</th>
            <th>Battery Power (kW)</th>
            <th>Trans. Efficiency</th>
            <th>Drag Coef.</th>
            <th>Front Area (m²)</th>
            <th>Rolling Coef.</th>
            <th>Roll Resist 1</th>
            <th>Roll Resist 2</th>
            <th>Pedal Input</th>
            <th>Gear Param 1</th>
            <th>Gear Param 2</th>
            <th>Battery Eff.</th>
            <th>Min SOC</th>
            <th>Max SOC</th>
            <th>Initial SOC</th>
            <th>Motor Eff.</th>
            <th>Regen. Eff.</th>
            <th>Switch Buffer</th>
            <th>Batt. Cap. (kWh)</th>
            <th>Aux. Power (kW)</th>
            <th>α₀</th>
            <th>α₁</th>
            <th>α₂</th>
            <th>α₃</th>
          </tr>
        </thead>
        <tbody>
          {vehicleParams.length > 0 ? (
            vehicleParams.map((param, index) => {
              const values = param.param_string.split(" ");
              const vehicleType = vehicleTypes.find(vt => vt.name === param.type_name);
              return (
                <tr key={index}>
                  <td>{param.id}</td>
                  <td>{vehicleType?.full_name || param.type_name}</td>
                  <td>
                    <div className={`type_name ${getColorClass(index)}`}>
                      {param.type_name}
                    </div>
                  </td>
                  {values.slice(2).map((value, idx) => (
                    <td key={idx}>{Number(value).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 6
                    })}</td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="31" className="no-data">
                No vehicle parameters available. Please upload a configuration file.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderUploadSection = () => (
    <div className="upload-container">
      <div className="upload-content">
        <input
          type="file"
          id="file-upload"
          onChange={handleFileUpload}
          accept=".txt,.dat"
          className="file-input"
          disabled={loading}
        />
        <label htmlFor="file-upload" className="upload-label">
          <span className="upload-icon">⇧</span>
          <div className="upload-text">
            {loading ? 'Uploading...' : 'Upload Vehicle Parameters File'}
            <span className="file-type">TXT or CSV</span>
          </div>
        </label>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );

  const renderFormatGuide = () => (
    <div className="format-guide">
      <div className="format-guide-header">
        <h3 className="guide-title">File Format Requirements</h3>
      </div>
      
      <div className="guide-content">
        <p>Each line represents one vehicle configuration with space-separated values:</p>
        
        <div className="param-columns">
          <div className="param-group">
            <h5>Vehicle Identification</h5>
            <ul>
              <li><strong>Column 1:</strong> Vehicle type number (1-25)</li>
              <li><strong>Column 2:</strong> Engine type:
                <ul>
                  {vehicleTypes.map(type => (
                    <li key={type.id}>{type.engine_id}: {type.name} ({type.full_name})</li>
                  ))}
                </ul>
              </li>
            </ul>
          </div>
  
          <div className="param-group">
            <h5>Physical Properties</h5>
            <ul>
              <li><strong>Column 3:</strong> Vehicle mass (kg)</li>
              <li><strong>Column 4:</strong> Vehicle length (m)</li>
              <li><strong>Column 5:</strong> Mass proportion on tractive axle</li>
              <li><strong>Column 6:</strong> Coefficient of friction</li>
              <li><strong>Column 7:</strong> Engine power (kW)</li>
              <li><strong>Column 8:</strong> Maximum battery power (kW)</li>
            </ul>
          </div>
  
          <div className="param-group">
            <h5>Operation Parameters</h5>
            <ul>
              <li><strong>Column 9-14:</strong> Performance coefficients</li>
              <li><strong>Column 15-17:</strong> Driver and gear parameters</li>
              <li><strong>Column 18-23:</strong> Battery and motor parameters</li>
              <li><strong>Column 24-26:</strong> Power management</li>
              <li><strong>Column 27-30:</strong> Model coefficients (α₀-α₃)</li>
            </ul>
          </div>
        </div>
  
        <div className="example-line">
          <h5>Example:</h5>
          <code>1 3 1981 4.75 0.6 0.5 317 317 0.92 0.23 2.652 1.75 ...</code>
          <p className="example-desc">Battery Electric Vehicle (BEV) configuration</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="vehicles-content">
      <section className="parameters-section">
        <h1 className="section-title">Vehicle Parameters</h1>
        <p className="section-description">Current vehicle configurations and their parameters.</p>
        {renderTable()}
      </section>

      <section className="update-section">
        <h2 className="section-title">Update Parameters</h2>
        <p className="section-description">
          Manage vehicle types and upload parameter configurations.
        </p>
        {renderVehicleTypesReference()}
        {renderUploadSection()}
        {renderFormatGuide()}
      </section>

      {showTypeModal && renderAddTypeModal()}
    </div>
  );
};

export default Vehicles;