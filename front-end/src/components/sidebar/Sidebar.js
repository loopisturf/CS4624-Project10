import React, { useState, useEffect, useRef } from 'react';
import './Sidebar.css';

const Sidebar = ({
  isOpen,
  setEstimationResult,
  collectionId,
  viewMode,
  setViewMode
}) => {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vehicleParams, setVehicleParams] = useState([]);
  const [selected, setSelected] = useState([]);
  const [collectionData, setCollectionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch types, params, and optionally the current collection
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch('/api/vehicle-types');
        if (!res.ok) throw new Error();
        setVehicleTypes(await res.json());
      } catch {
        setError('Failed loading engine types');
      }
    };
    const fetchParams = async () => {
      try {
        const res = await fetch('/api/vehicle-params');
        if (!res.ok) throw new Error();
        setVehicleParams(await res.json());
      } catch {
        setError('Failed loading vehicles');
      }
    };
    const fetchCollection = async () => {
      if (!collectionId) return;
      try {
        const res = await fetch(`/api/collections/${collectionId}`);
        if (!res.ok) throw new Error();
        setCollectionData(await res.json());
      } catch {
        setError('Failed loading collection');
      }
    };

    fetchTypes();
    fetchParams();
    fetchCollection();
  }, [collectionId]);

  // Toggle a single vehicle’s selection
  const toggle = (id) => {
    setSelected(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      if (!next.includes(id)) setEstimationResult(id, null);
      return next;
    });
  };

  // Toggle multiple selections (global or group)
  const toggleMultiple = (ids, select) => {
    setSelected(prev => {
      let next = select
        ? Array.from(new Set([...prev, ...ids]))
        : prev.filter(x => !ids.includes(x));
      if (!select) {
        // clear results for removed ids
        ids.forEach(id => setEstimationResult(id, null));
      }
      return next;
    });
  };

  // Analyze handler
  const handleAnalyze = async () => {
    if (!collectionData?.speed_profile) {
      setError('No speed profile to analyze');
      return;
    }
    if (selected.length === 0) {
      setError('Select at least one vehicle');
      return;
    }
    setLoading(true);
    setError(null);
    for (let id of selected) {
      try {
        const formData = new FormData();
        const csv = collectionData.speed_profile.join('\n');
        formData.append('file', new File([csv], 'speed.csv', { type: 'text/csv' }));
        formData.append('vehicle_param_id', id);
        formData.append('username', 'user');
        formData.append('collection_id', collectionId);

        const res = await fetch('/api/estimate', {
          method: 'POST',
          body: formData
        });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload.error || 'Server error');

        const p = vehicleParams.find(v => v.id === id) || {};
        setEstimationResult(id, {
          ...payload,
          make: p.make, model: p.model, year: p.year,
          label: `${p.make} ${p.model} (${p.year})`
        });
      } catch (e) {
        setError(e.message);
      }
    }
    setLoading(false);
  };

  // Compute global select-all state
  const allIds = vehicleParams.map(v => v.id);
  const allSelected = allIds.length > 0 && allIds.every(id => selected.includes(id));
  const allIndeterminate = selected.length > 0 && selected.length < allIds.length;

  return (
    <aside className="sidebar-container" data-open={isOpen}>
      <div className="sidebar-content">
        <h2 className="sidebar-title">Select Vehicles</h2>
        {error && <div className="error-message">{error}</div>}

        {/* Global Select All */}
        <div className="engine-option select-all-global">
          <input
            type="checkbox"
            ref={el => el && (el.indeterminate = allIndeterminate)}
            checked={allSelected}
            onChange={e => toggleMultiple(allIds, e.target.checked)}
            disabled={loading}
            className="engine-checkbox"
          />
          <label className="engine-label"><strong>Select All Vehicles</strong></label>
        </div>

        {/* Grouped list */}
        <div className="engine-list">
          {vehicleTypes.map(type => {
            const cars = vehicleParams.filter(p => p.vehicle_type_id === type.id);
            const groupIds = cars.map(c => c.id);
            const groupSelected = groupIds.length > 0 && groupIds.every(id => selected.includes(id));
            const groupIndeterminate = groupIds.some(id => selected.includes(id)) && !groupSelected;

            return (
              <div key={type.id} className="engine-group">
                <div className="engine-group-header">
                  <input
                    type="checkbox"
                    ref={el => el && (el.indeterminate = groupIndeterminate)}
                    checked={groupSelected}
                    onChange={e => toggleMultiple(groupIds, e.target.checked)}
                    disabled={loading}
                    className="engine-checkbox"
                  />
                  <span>{type.full_name}</span>
                </div>

                {cars.length > 0
                  ? cars.map(car => (
                      <div key={car.id} className="engine-option">
                        <input
                          type="checkbox"
                          checked={selected.includes(car.id)}
                          onChange={() => toggle(car.id)}
                          disabled={loading}
                          className="engine-checkbox"
                        />
                        <label className="engine-label">
                          {car.make} {car.model} ({car.year})
                        </label>
                      </div>
                    ))
                  : (
                    <div className="no-vehicles">No vehicles</div>
                  )
                }
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <button
          onClick={() => { handleAnalyze(); setViewMode('individual'); }}
          className="analyze-button"
        >
          Analyze Selected
        </button>
        <button
          onClick={() => { handleAnalyze(); setViewMode('combined'); }}
          className="analyze-button"
        >
          Combined Analysis
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;