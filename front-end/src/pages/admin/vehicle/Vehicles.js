import React, { useState, useEffect } from 'react';
import './Vehicles.css';

const Vehicles = () => {
  // Array with descriptive names for tokens 5-32 (28 parameters)
  const parameterNames = [
    "Mass (kg)",
    "Length (m)",
    "Proportion on axle",
    "Friction Coef.",
    "Engine Power (kW)",
    "Max Power (kW)",
    "Trans. Eff.",
    "Drag Coef.",
    "Frontal Area (m²)",
    "Rolling Coef.",
    "c1",
    "c2",
    "Pedal Input",
    "Gr1",
    "Gr2",
    "Battery Eff.",
    "Min SOC",
    "Max SOC",
    "Initial SOC",
    "Motor Eff.",
    "Regen Eff.",
    "SOC Limit PHEV",
    "Batt. Cap. (kWh)",
    "Aux. Power (kW)",
    "Alpha 0",
    "Alpha 1",
    "Alpha 2",
    "Alpha 3"
  ];

  // State for vehicle records (the updated vehicle_params records)
  const [vehicleParams, setVehicleParams] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // State for modal (for adding/updating a vehicle record)
  const [showParamModal, setShowParamModal] = useState(false);
  const [editingParam, setEditingParam] = useState(null); // null = add new, non-null = edit
  const [paramRecord, setParamRecord] = useState({
    make: '',
    model: '',
    year: '',
    vehicle_type_id: '',
    param_string: '' // space-separated 28 numbers
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
      if (data.length > 0 && !paramRecord.vehicle_type_id) {
        setParamRecord(prev => ({ ...prev, vehicle_type_id: data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for modal (add/update a vehicle record)
  const openAddParamModal = () => {
    setEditingParam(null);
    setParamRecord({
      make: '',
      model: '',
      year: '',
      vehicle_type_id: vehicleTypes.length > 0 ? vehicleTypes[0].id : '',
      param_string: ''
    });
    setShowParamModal(true);
  };

  const openEditParamModal = (record) => {
    setEditingParam(record.id);
    setParamRecord({
      make: record.make,
      model: record.model,
      year: record.year,
      vehicle_type_id: record.vehicle_type_id,
      param_string: record.param_string
    });
    setShowParamModal(true);
  };

  const handleParamModalSubmit = async (e) => {
    e.preventDefault();
    if (!paramRecord.make || !paramRecord.model || !paramRecord.year || !paramRecord.vehicle_type_id) {
      setError('Make, Model, Year, and Vehicle Type are required');
      return;
    }
    const tokens = paramRecord.param_string.trim().split(/\s+/);
    if (tokens.length !== 28) {
      setError('The parameter string must contain exactly 28 numbers separated by spaces');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        make: paramRecord.make,
        model: paramRecord.model,
        year: parseInt(paramRecord.year),
        vehicle_type_id: parseInt(paramRecord.vehicle_type_id),
        param_string: paramRecord.param_string.trim()
      };
      let response;
      if (editingParam) {
        response = await fetch(`/api/admin/vehicle-params/${editingParam}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('/api/admin/vehicle-params', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`)}`
          },
          body: JSON.stringify(payload)
        });
      }
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save vehicle record');
      }
      setShowParamModal(false);
      await fetchVehicleParams();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Updated renderTable function with two header rows
  const renderTable = () => (
    <div className="table-container">
      <table className="vehicle-params-table">
        <thead>
          <tr>
            <th rowSpan="2">ID</th>
            <th rowSpan="2">Make</th>
            <th rowSpan="2">Model</th>
            <th rowSpan="2">Year</th>
            <th rowSpan="2">Vehicle Type</th>
            <th colSpan="28">Parameters</th>
            <th rowSpan="2">Actions</th>
          </tr>
          <tr>
            {parameterNames.map((name, index) => (
              <th key={index}>{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {vehicleParams.length > 0 ? (
            vehicleParams.map((record) => {
              const paramsArray = record.param_string.trim().split(/\s+/);
              return (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>{record.make}</td>
                  <td>{record.model}</td>
                  <td>{record.year}</td>
                  <td>{record.vehicle_type}</td>
                  {paramsArray.map((val, idx) => (
                    <td key={idx}>{val}</td>
                  ))}
                  <td>
                    <button className="add-type-button" onClick={() => openEditParamModal(record)}>
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5 + 28 + 1} className="no-data">
                No vehicle records available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // Modal for adding/editing a vehicle record
  const renderParamModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{editingParam ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
          <button className="close-button" onClick={() => setShowParamModal(false)}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleParamModalSubmit}>
            <div className="form-group">
              <label>Make:</label>
              <input
                type="text"
                value={paramRecord.make}
                onChange={(e) => setParamRecord({ ...paramRecord, make: e.target.value })}
                className="type-input"
              />
            </div>
            <div className="form-group">
              <label>Model:</label>
              <input
                type="text"
                value={paramRecord.model}
                onChange={(e) => setParamRecord({ ...paramRecord, model: e.target.value })}
                className="type-input"
              />
            </div>
            <div className="form-group">
              <label>Year:</label>
              <input
                type="number"
                value={paramRecord.year}
                onChange={(e) => setParamRecord({ ...paramRecord, year: e.target.value })}
                className="type-input"
              />
            </div>
            <div className="form-group">
              <label>Vehicle Type:</label>
              <select
                value={paramRecord.vehicle_type_id}
                onChange={(e) => setParamRecord({ ...paramRecord, vehicle_type_id: e.target.value })}
                className="type-input"
              >
                {vehicleTypes.map((vt) => (
                  <option key={vt.id} value={vt.id}>
                    {vt.name} ({vt.full_name})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Parameters (enter 28 numbers separated by spaces):</label>
              <textarea
                value={paramRecord.param_string}
                onChange={(e) => setParamRecord({ ...paramRecord, param_string: e.target.value })}
                className="type-input"
                rows="3"
              ></textarea>
            </div>
            <div className="button-group">
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Saving...' : editingParam ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowParamModal(false)}
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

  // Render the format guide for vehicle parameters
  const renderFormatGuide = () => (
    <div className="format-guide">
      <div className="format-guide-header">
        <h3 className="guide-title">File Format Requirements &amp; Parameter Meanings</h3>
      </div>
      <div className="guide-content">
        <p>
          Each line represents one vehicle record with space-separated values.
        </p>
        <div className="param-columns">
          <div className="param-group">
            <h5>Identification (Tokens 1–4)</h5>
            <ul>
              <li><strong>Token 1:</strong> Car Make (e.g., Toyota)</li>
              <li><strong>Token 2:</strong> Car Model (e.g., Camry)</li>
              <li><strong>Token 3:</strong> Car Year (e.g., 2020)</li>
              <li><strong>Token 4:</strong> Engine type token (a number used to map to ICEV, BEV, HEV, or HFCV)</li>
            </ul>
          </div>
          <div className="param-group">
            <h5>Vehicle Parameters (Tokens 5–32)</h5>
            <ul>
              <li><strong>Token 5:</strong> Vehicle mass (kg)</li>
              <li><strong>Token 6:</strong> Vehicle length (m)</li>
              <li><strong>Token 7:</strong> Proportion on tractive axle</li>
              <li><strong>Token 8:</strong> Coefficient of friction</li>
              <li><strong>Token 9:</strong> Engine power (kW)</li>
              <li><strong>Token 10:</strong> Maximum power (kW)</li>
              <li><strong>Token 11:</strong> Transmission efficiency</li>
              <li><strong>Token 12:</strong> Drag coefficient</li>
              <li><strong>Token 13:</strong> Frontal area (m²)</li>
              <li><strong>Token 14:</strong> Rolling coefficient</li>
              <li><strong>Token 15:</strong> c1</li>
              <li><strong>Token 16:</strong> c2</li>
              <li><strong>Token 17:</strong> Pedal input</li>
              <li><strong>Token 18:</strong> Gr1</li>
              <li><strong>Token 19:</strong> Gr2</li>
              <li><strong>Token 20:</strong> Battery efficiency</li>
              <li><strong>Token 21:</strong> Minimum SOC</li>
              <li><strong>Token 22:</strong> Maximum SOC</li>
              <li><strong>Token 23:</strong> Initial SOC</li>
              <li><strong>Token 24:</strong> Motor efficiency</li>
              <li><strong>Token 25:</strong> Regenerative efficiency</li>
              <li><strong>Token 26:</strong> SOC limit PHEV</li>
              <li><strong>Token 27:</strong> Battery capacity (kWh)</li>
              <li><strong>Token 28:</strong> Auxiliary consumption (kW)</li>
              <li><strong>Token 29:</strong> Alpha 0</li>
              <li><strong>Token 30:</strong> Alpha 1</li>
              <li><strong>Token 31:</strong> Alpha 2</li>
              <li><strong>Token 32:</strong> Alpha 3</li>
            </ul>
          </div>
        </div>
        <div className="example-line">
          <h5>Example Record:</h5>
          <code>
            Toyota Camry 2020 1 1500 4.5 0.65 0.75 120 150 0.85 0.32 2.5 0.9 0.5 0.3 0.7 1.2 0.9 0.95 0.8 0.75 0.85 0.50 0.95 0.70 0.60 0.55 0.50 1.10 0.90 0.80
          </code>
          <p className="example-desc">
            For example, this record means "Toyota Camry" from 2020 with an engine token 1 (ICEV), followed by 28 parameters.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="vehicles-content">
      <section className="parameters-section">
        <h1 className="section-title">Vehicle Parameters</h1>
        <p className="section-description">
          View and manage car records with all their parameters.
        </p>
        <button className="add-type-button" onClick={openAddParamModal}>
          Add New Vehicle
        </button>
        <br></br>
        <br></br>
        {renderTable()}
      </section>
      {renderFormatGuide()}
      {showParamModal && renderParamModal()}
    </div>
  );
};

export default Vehicles;
