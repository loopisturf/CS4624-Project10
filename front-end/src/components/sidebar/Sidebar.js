import React, { useState, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = ({
  isOpen,
  setEstimationResult,
  collectionId,
  viewMode,
  setViewMode
}) => {
  const [vehicleParams, setVehicleParams] = useState([]);  // your cars
  const [selectedCars, setSelectedCars] = useState([]);   // ids of cars ticked
  const [collectionData, setCollectionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1) Load the list of cars
  useEffect(() => {
    fetch('/api/vehicle-params')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch vehicles');
        return res.json();
      })
      .then(setVehicleParams)
      .catch(err => {
        console.error(err);
        setError('Could not load vehicle list.');
      });
  }, []);

  // 2) Load the collection (to get speed_profile)
  useEffect(() => {
    if (!collectionId) return;
    fetch(`/api/collections/${collectionId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch collection');
        return res.json();
      })
      .then(setCollectionData)
      .catch(err => {
        console.error(err);
        setError('Could not load collection data.');
      });
  }, [collectionId]);

  const toggleCar = (id) => {
    setSelectedCars(curr =>
      curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id]
    );
    // if un-checking, clear its result
    if (selectedCars.includes(id)) {
      setEstimationResult(id, null);
    }
  };

  // 3) Send each selected car through /api/estimate
  const doAnalyze = async (combined) => {
    if (!collectionData?.speed_profile || selectedCars.length === 0) {
      setError('Select at least one vehicle and ensure a speed profile exists');
      return;
    }

    setLoading(true);
    setError(null);

    // clear any results for cars the user has now deselected
    Object.keys(collectionData.results || {}).forEach(key => {
      const id = Number(key);
      if (!selectedCars.includes(id)) setEstimationResult(id, null);
    });

    // loop
    for (let id of selectedCars) {
      const form = new FormData();
      form.append('file',
        new File(
          [collectionData.speed_profile.join('\n')],
          'speed_profile.csv',
          { type: 'text/csv' }
        )
      );
      form.append('vehicle_type_id', id);
      form.append('username', 'user');
      form.append('collection_id', collectionId);

      try {
        const res = await fetch('/api/estimate', { method: 'POST', body: form });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Estimate failed');
        }
        // pass back up: key = car id
        setEstimationResult(id, { ...data, engineType: data.vehicle_type || '' });
      } catch (err) {
        console.error(err);
        setError(prev => prev ? prev + '\n' + err.message : err.message);
      }
    }

    setLoading(false);
    setViewMode(combined ? 'combined' : 'charts');
  };

  return (
    <aside className="sidebar-container" data-open={isOpen}>
      <div className="sidebar-content">
        <h2 className="sidebar-title">Select Vehicles</h2>
        {error && <div className="error-message">{error}</div>}

        {/* Select All */}
        <div className="engine-option select-all">
          <label>
            <input
              type="checkbox"
              checked={selectedCars.length === vehicleParams.length}
              onChange={() => {
                if (selectedCars.length === vehicleParams.length) {
                  setSelectedCars([]);
                } else {
                  setSelectedCars(vehicleParams.map(v => v.id));
                }
              }}
              disabled={loading}
            />
            Select All Vehicles
          </label>
        </div>

        {/* Each vehicle */}
        {vehicleParams.map(v => (
          <div key={v.id} className="engine-option">
            <label>
              <input
                type="checkbox"
                checked={selectedCars.includes(v.id)}
                onChange={() => toggleCar(v.id)}
                disabled={loading}
              />
              {v.make} {v.model} ({v.year})
            </label>
          </div>
        ))}

        {/* Analyze buttons */}
        <button
          className="analyze-button"
          onClick={() => doAnalyze(false)}
          disabled={loading}
        >
          Analyze Individually
        </button>
        <button
          className="analyze-button"
          onClick={() => doAnalyze(true)}
          disabled={loading}
        >
          Analyze Combined
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
