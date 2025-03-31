import React, { useState, useEffect } from 'react';
import './Sidebar.css';

/**
 * Sidebar Component
 * Provides controls for selecting and analyzing different engine types
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls sidebar visibility
 * @param {Function} props.setEstimationResult - Callback to update estimation results in parent
 * @param {string} props.collectionId - ID of the current data collection
 * @param {string} props.viewMode - Current view mode ('metrics' or 'charts')
 * @param {Function} props.setViewMode - Callback to change view mode
 */
const Sidebar = ({ isOpen, setEstimationResult, collectionId, viewMode, setViewMode }) => {
  // State management for component
  const [engineTypes, setEngineTypes] = useState([]); // Available engine types
  const [selectedEngines, setSelectedEngines] = useState([]); // Currently selected engines
  const [loading, setLoading] = useState(false); // Loading state for analysis
  const [error, setError] = useState(null); // Error messages
  const [collectionData, setCollectionData] = useState(null); // Speed profile data
  const [estimationResults, setEstimationResults] = useState({}); // Analysis results

  /**
   * Effect hook to fetch initial data
   * Loads available engine types and collection data when component mounts
   */
  useEffect(() => {
    const fetchEngineTypes = async () => {
      try {
        const response = await fetch('/api/vehicle-types');
        if (!response.ok) throw new Error('Failed to fetch engine types');
        const data = await response.json();
        setEngineTypes(data);
      } catch (err) {
        console.error('Error fetching engine types:', err);
        setError('Failed to load engine types. Please refresh the page.');
      }
    };

    const fetchCollection = async () => {
      if (collectionId) {
        try {
          const response = await fetch(`/api/collections/${collectionId}`);
          if (!response.ok) throw new Error('Failed to fetch collection');
          const data = await response.json();
          setCollectionData(data);
        } catch (err) {
          console.error('Error fetching collection:', err);
          setError('Failed to load collection data. Please refresh the page.');
        }
      }
    };

    fetchEngineTypes();
    fetchCollection();
  }, [collectionId]);

  /**
   * Reset selections when collection changes
   */
  useEffect(() => {
    setSelectedEngines([]);
    setEstimationResults({});
  }, [collectionId]);

  /**
   * Handles individual engine selection/deselection
   * @param {number} engineId - ID of the engine to toggle
   */
  const handleEngineSelect = (engineId) => {
    const newSelection = selectedEngines.includes(engineId)
      ? selectedEngines.filter(id => id !== engineId)
      : [...selectedEngines, engineId];
    
    setSelectedEngines(newSelection);
    
    // Clear results for deselected engine
    if (!newSelection.includes(engineId)) {
      setEstimationResult(engineId, null);
    }
  };

  /**
   * Handles select/deselect all engines functionality
   */
  const handleSelectAll = () => {
    if (selectedEngines.length === engineTypes.length) {
      // If all are selected, deselect all
      setSelectedEngines([]);
      engineTypes.forEach(engine => setEstimationResult(engine.id, null));
    } else {
      // Select all
      const allEngineIds = engineTypes.map(engine => engine.id);
      setSelectedEngines(allEngineIds);
    }
  };

  /**
   * Initiates analysis for selected engines
   * Processes each selected engine sequentially and updates results
   */
  const handleAnalyze = async () => {
    // Validation checks
    if (selectedEngines.length === 0) {
      setError('Please select at least one engine type');
      return;
    }

    if (!collectionData?.speed_profile) {
      setError('No speed profile data available');
      return;
    }

    setLoading(true);
    setError(null);

    // Clear results for deselected engines
    Object.keys(estimationResults).forEach(engineId => {
      if (!selectedEngines.includes(Number(engineId))) {
        setEstimationResult(engineId, null);
      }
    });

    // Process each selected engine
    for (const engineId of selectedEngines) {
      try {
        // Prepare speed profile data
        const formData = new FormData();
        const csvContent = collectionData.speed_profile.map(speed => speed.toString()).join('\n');
        const speedProfileFile = new File([csvContent], 'speed_profile.csv', { type: 'text/csv' });
        
        // Set up form data for API request
        formData.append('file', speedProfileFile);
        formData.append('vehicle_type_id', engineId);
        formData.append('username', 'user');
        formData.append('collection_id', collectionId);

        // Make API request
        const response = await fetch('/api/estimate', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        
        // Handle API errors
        if (!response.ok) {
          console.error(`Failed to analyze engine ${engineId}:`, data.error);
          setError(prev => 
            prev ? `${prev}\n${engineTypes.find(t => t.id === engineId)?.name}: ${data.error}` 
                 : `${engineTypes.find(t => t.id === engineId)?.name}: ${data.error}`
          );
          continue;
        }
        
        // Process successful response
        const result = {
          ...data,
          engineType: engineTypes.find(type => type.id === engineId)?.name
        };
        
        // Update results in parent and local state
        setEstimationResult(engineId, result);
        setEstimationResults(prev => ({
          ...prev,
          [engineId]: result
        }));

      } catch (error) {
        console.error(`Error analyzing engine ${engineId}:`, error);
        setError(prev => 
          prev ? `${prev}\n${engineTypes.find(t => t.id === engineId)?.name}: ${error.message}`
               : `${engineTypes.find(t => t.id === engineId)?.name}: ${error.message}`
        );
        continue;
      }
    }

    setLoading(false);
  };

  return (
    <aside className="sidebar-container" data-open={isOpen}>
      <div className="sidebar-content">
        <h2 className="sidebar-title">Select Engine Types</h2>
        
        {/* Error message display */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {/* View mode toggle buttons */}
        <div className="view-toggle sidebar-view-toggle">
          <button 
            className={`toggle-button ${viewMode === 'metrics' ? 'active' : ''}`}
            onClick={() => setViewMode('metrics')}
          >
            Key Metrics
          </button>
          <button 
            className={`toggle-button ${viewMode === 'charts' ? 'active' : ''}`}
            onClick={() => setViewMode('charts')}
          >
            Efficiency Analysis
          </button>
        </div>

        {/* Engine selection list */}
        <div className="engine-list">
          {/* Select all checkbox */}
          <div className="engine-option select-all">
            <input
              type="checkbox"
              id="select-all"
              checked={selectedEngines.length === engineTypes.length}
              onChange={handleSelectAll}
              disabled={loading}
              className="engine-checkbox"
              aria-label="Select all engine types"
            />
            <label htmlFor="select-all" className="engine-label">
              Select All
            </label>
          </div>
          
          {/* Individual engine checkboxes */}
          {engineTypes.map(engine => (
            <div key={engine.id} className="engine-option">
              <input
                type="checkbox"
                id={`engine-${engine.id}`}
                checked={selectedEngines.includes(engine.id)}
                onChange={() => handleEngineSelect(engine.id)}
                disabled={loading}
                className="engine-checkbox"
                aria-label={`Select ${engine.name}`}
              />
              <label htmlFor={`engine-${engine.id}`} className="engine-label">
                {engine.name}
              </label>
            </div>
          ))}
        </div>

        {/* Analysis buttons */}
        <button onClick={() => {
            // First analyze individually then set view mode to 'individual'
            handleAnalyze();
            setViewMode('individual');
          }} 
          className="analyze-button"
        >
          Analyze Selected Engines
        </button>

        <button onClick={() => {
            // Analyze and then show combined view
            handleAnalyze();
            setViewMode('combined');
          }} 
          className="analyze-button"
        >
          Analyze Selected Engines Together
        </button> 

      </div>
    </aside>
  );
};

export default Sidebar;
