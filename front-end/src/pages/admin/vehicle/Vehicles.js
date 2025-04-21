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

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [newVehicle, setNewVehicle] = useState({
    vehicle_type_id: '',
    make: '',
    model: '',
    year: '',
    param_string: ''
  });

  // --- grouping vehicles by type ---
  const groupedVehicles = vehicleTypes.reduce((acc, type) => {
    acc[type.id] = { type, items: [] };
    return acc;
  }, {});
  vehicleParams.forEach(v => {
    if (groupedVehicles[v.vehicle_type_id]) {
      groupedVehicles[v.vehicle_type_id].items.push(v);
    }
  });

  // --- open modal for add/edit ---
  const openVehicleModal = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle.id);
      setNewVehicle({
        vehicle_type_id: vehicle.vehicle_type_id,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        param_string: vehicle.param_string
      });
    } else {
      setEditingVehicle(null);
      setNewVehicle({ vehicle_type_id: '', make: '', model: '', year: '', param_string: '' });
    }
    setShowVehicleModal(true);
  };

  // --- handler to save via API ---
  const handleSaveVehicle = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // ── VALIDATE PARAM STRING LENGTH ──
    const parts = newVehicle.param_string.trim().split(/\s+/);
    if (parts.length === 29) {
      newVehicle.param_string = '0 ' + newVehicle.param_string;
    }
    else if (parts.length !== 30) {
      setLoading(false);
      alert('Param String must be exactly 29 numeric values, space‑separated');
      return;
    }

    const url = editingVehicle
      ? `/api/admin/vehicle-params/${editingVehicle}`
      : '/api/admin/vehicle-params';
    const method = editingVehicle ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)}`
        },
        body: JSON.stringify(newVehicle)
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        alert((err && err.error) || 'Save failed');
        throw new Error('Save failed');
      }
      await fetchVehicleParams();
      setShowVehicleModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- updated renderVehicles ---
  const renderVehicles = () => (
    <div className="vehicle-types-reference">
      <div className="reference-header">
        <h3 className="subtitle">Available Vehicles</h3>
        <button className="add-type-button" onClick={() => openVehicleModal()}>
          Add New Vehicle
        </button>
      </div>
      {vehicleTypes.map((type, i) => (
        <div key={type.id} className="vehicle-group">
          <h4 className="subtitle" style={{ marginTop: '1rem' }}>{type.full_name}</h4>
          <table className="reference-table">
            <thead>
              <tr>
                <th>Make</th>
                <th>Model</th>
                <th>Year</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groupedVehicles[type.id]?.items.map(v => (
                <tr key={v.id}>
                  <td>{v.make}</td>
                  <td>{v.model}</td>
                  <td>{v.year}</td>
                  <td>
                    <button onClick={() => openVehicleModal(v)}>Edit</button>
                    <button
                      onClick={async () => {
                        if (!window.confirm('Really delete this vehicle?')) return;
                        setLoading(true);
                        setError(null);
                        try {
                          const res = await fetch(`/api/admin/vehicle-params/${v.id}`, {
                            method: 'DELETE',
                            headers: {
                              'Authorization': `Basic ${btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)}`
                            }
                          });
                          if (!res.ok) {
                            const err = await res.json().catch(() => null);
                            throw new Error((err && err.error) || 'Delete failed');
                          }
                          // remove it from local state immediately:
                          setVehicleParams(prev => prev.filter(p => p.id !== v.id));
                        } catch (err) {
                          setError(err.message);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {groupedVehicles[type.id]?.items.length === 0 && (
                <tr><td colSpan="4" className="no-data">No vehicles</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );

  // --- updated renderVehicleModal ---
  const renderVehicleModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
          <button className="close-button" onClick={() => setShowVehicleModal(false)}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSaveVehicle}>
            <div className="form-group">
              <label>Engine Type:</label>
              <select
                value={newVehicle.vehicle_type_id}
                onChange={e => setNewVehicle(prev => ({ ...prev, vehicle_type_id: e.target.value }))}
                className="type-input"
                required
              >
                <option value="">-- Select --</option>
                {vehicleTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Make:</label>
              <input
                type="text"
                value={newVehicle.make}
                onChange={e => setNewVehicle(prev => ({ ...prev, make: e.target.value }))}
                className="type-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Model:</label>
              <input
                type="text"
                value={newVehicle.model}
                onChange={e => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                className="type-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Year:</label>
              <input
                type="number"
                value={newVehicle.year}
                onChange={e => setNewVehicle(prev => ({ ...prev, year: e.target.value }))}
                className="type-input"
                required
              />
            </div>
            <div className="form-group">
              <label>Param String:</label>
              <textarea
                value={newVehicle.param_string}
                onChange={e => setNewVehicle(prev => ({ ...prev, param_string: e.target.value }))}
                className="type-input"
                rows={3}
                required
              />
            </div>
            <div className="button-group">
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowVehicleModal(false)}
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
            <th>Type</th>
            <th>Make</th>
            <th>Model</th>
            <th>Year</th>
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
              return (
                <tr key={index}>
                  <td>{param.id}</td>
                  <td>
                    <div className={`type_name ${getColorClass(index)}`}>
                      {param.type_name}
                    </div>
                  </td>
                  <td>{param.make}</td>
                  <td>{param.model}</td>
                  <td>{param.year}</td>
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

  const renderFormatGuide = () => (
    <div className="format-guide">
      <div className="format-guide-header">
        <h3 className="guide-title">Parameter Format Requirements</h3>
      </div>

      <div className="guide-content">
        <p>Each line represents one vehicle configuration with space-separated values:</p>

        <div className="param-columns">
          <div className="param-group">
            <h5>Vehicle Identification</h5>
            <ul>
              <li><strong>Column 1:</strong> Engine type:
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
              <li><strong>Column 2:</strong> Vehicle mass (kg)</li>
              <li><strong>Column 3:</strong> Vehicle length (m)</li>
              <li><strong>Column 4:</strong> Mass proportion on tractive axle</li>
              <li><strong>Column 5:</strong> Coefficient of friction</li>
              <li><strong>Column 6:</strong> Engine power (kW)</li>
              <li><strong>Column 7:</strong> Maximum battery power (kW)</li>
            </ul>
          </div>

          <div className="param-group">
            <h5>Operation Parameters</h5>
            <ul>
              <li><strong>Column 9-13:</strong> Performance coefficients</li>
              <li><strong>Column 14-16:</strong> Driver and gear parameters</li>
              <li><strong>Column 17-22:</strong> Battery and motor parameters</li>
              <li><strong>Column 23-25:</strong> Power management</li>
              <li><strong>Column 26-29:</strong> Model coefficients (α₀-α₃)</li>
            </ul>
          </div>
        </div>

        <div className="example-line">
          <h5>Example:</h5>
          <code>3 1981 4.75 0.6 0.5 317 317 0.92 0.23 2.652 1.75 ...</code>
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
        {renderVehicles()}
        {renderFormatGuide()}
      </section>

      {showVehicleModal && renderVehicleModal()}
    </div>
  );
};

export default Vehicles;