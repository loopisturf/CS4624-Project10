import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts'; // Old Import
import Plot from 'react-plotly.js'; // Import Plotly
import Sidebar from '../../components/sidebar/Sidebar.js';
import './Body.css';

const MetricCard = ({ label, value, unit }) => (
  <div className="metric-card">
    <h3 className="metric-label">{label}</h3>
    <p className="metric-value">
      {typeof value === 'number' ? value.toFixed(2) : value} {unit}
    </p>
  </div>
);

const getAvailableMetrics = (engineType, data) => {
  const metrics = [];
  if (data?.model) {
    switch (engineType) {
      case 'ICEV':
      case 'HEV':
        metrics.push({ 
          id: 'fuel_rate', 
          label: 'Fuel Rate', 
          unit: 'L/s', 
          color: engineType == 'ICEV' ? '#2a9d30' : '#e63946', // Allows for different line colors
          valueKey: 'model',
          processValue: (v) => Math.abs(Number(v))
        });
        metrics.push({
          id: 'fuel_economy',
          label: 'Fuel Economy',
          unit: 'MPG',
          color: engineType == 'ICEV' ? '#7c51d9' : '#457b9d', // Allows for different line colors
          valueKey: 'model',
          processValue: (v, speed) => speed > 0 ? (0.621371 / (v * 3.6)) : 0
        });
        break;
        
      case 'BEV':
      case 'HFCV':
        metrics.push({ 
          id: 'power', 
          label: 'Power Output', 
          unit: 'kW', 
          color: engineType == 'BEV' ? '#2a9d8f' : '#ea41c2', // Allows for different line colors
          valueKey: 'model',
          processValue: (v) => Math.abs(Number(v))
        });
        metrics.push({
          id: 'energy_efficiency',
          label: 'Energy Efficiency',
          unit: 'mi/kWh',
          color: engineType == 'BEV' ? '#ff2828' : '#f4a261', // Allows for different line colors
          valueKey: 'model',
          processValue: (v, speed) => speed > 0 ? (0.621371 * speed) / (Math.abs(v) * 3600) : 0
        });
        break;

      default:
        metrics.push({
          id: 'unknown',
          label: 'Unknown Metric',
          unit: '-',
          color: '#666666',
          valueKey: 'model',
          processValue: (v) => Number(v)
        });
    }
  }

  return metrics;
};

const EnergyChart = ({ data, engineType, speedProfile }) => {
  const availableMetrics = useMemo(() => 
    getAvailableMetrics(engineType, data), 
    [engineType, data]
  );

  const [selectedMetric, setSelectedMetric] = useState('');
  // TODO Remove Bins!
  const [visualizationType, setVisualizationType] = useState('binned');
  const [binSize, setBinSize] = useState(1);
  const [windowSize, setWindowSize] = useState(50);
  const [samplingRate, setSamplingRate] = useState(10);

  useEffect(() => {
    if (availableMetrics.length > 0) {
      setSelectedMetric(availableMetrics[0].id);
    }
  }, [availableMetrics]);

  const processChartData = useMemo(() => {
    if (!data?.model || !speedProfile || !selectedMetric) return [];
    
    const metricConfig = availableMetrics.find(m => m.id === selectedMetric);
    if (!metricConfig) return [];

    switch (visualizationType) {
      case 'binned': {
        const binnedData = new Map();
        speedProfile.forEach((speed, index) => {
          if (speed > 0) {
            const binKey = Math.floor(speed / binSize) * binSize;
            if (!binnedData.has(binKey)) {
              binnedData.set(binKey, {
                speed: binKey,
                values: [],
                count: 0
              });
            }
            const value = metricConfig.processValue(data.model[index], speed);
            if (!isNaN(value) && isFinite(value)) {
              const bin = binnedData.get(binKey);
              bin.values.push(value);
              bin.count++;
            }
          }
        });

        return Array.from(binnedData.entries())
          .map(([speed, bin]) => ({
            speed,
            value: bin.values.reduce((sum, val) => sum + val, 0) / bin.count,
            min: Math.min(...bin.values),
            max: Math.max(...bin.values),
            count: bin.count
          }))
          .filter(point => point.count > 0)
          .sort((a, b) => a.speed - b.speed);
      }

      case 'moving': {
        const validPoints = speedProfile
          .map((speed, index) => ({
            speed,
            value: metricConfig.processValue(data.model[index], speed)
          }))
          .filter(point => point.speed > 0 && !isNaN(point.value) && isFinite(point.value));

        const movingAverage = [];
        for (let i = 0; i < validPoints.length; i += windowSize) {
          const start = Math.max(0, i - windowSize / 2);
          const end = Math.min(validPoints.length, i + windowSize / 2);
          const windowPoints = validPoints.slice(start, end);
          
          if (windowPoints.length > 0) {
            movingAverage.push({
              speed: validPoints[i].speed,
              value: windowPoints.reduce((sum, p) => sum + p.value, 0) / windowPoints.length
            });
          }
        }
        return movingAverage.sort((a, b) => a.speed - b.speed);
      }

      case 'sampled': {
        return speedProfile
          .filter((_, index) => index % samplingRate === 0)
          .map((speed, index) => ({
            speed,
            value: metricConfig.processValue(data.model[index * samplingRate], speed)
          }))
          .filter(point => point.speed > 0 && !isNaN(point.value) && isFinite(point.value))
          .sort((a, b) => a.speed - b.speed);
      }

      default:
        return [];
    }
  }, [data, speedProfile, selectedMetric, visualizationType, binSize, windowSize, samplingRate, availableMetrics]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const metric = availableMetrics.find(m => m.id === selectedMetric);
    return (
      <div className="custom-tooltip">
        <p>Speed: {label} km/h</p>
        <p>{metric.label}: {payload[0].value.toFixed(4)} {metric.unit}</p>
        {visualizationType === 'binned' && (
          <div>
            <p>Min: {payload[0].payload.min?.toFixed(4)}</p>
            <p>Max: {payload[0].payload.max?.toFixed(4)}</p>
            <p>Sample Size: {payload[0].payload.count}</p>
          </div>
        )}
      </div>
    );
  };

  if (!selectedMetric || processChartData.length === 0) {
    return <div className="no-data-message">No data available for visualization</div>;
  }

  const selectedMetricConfig = availableMetrics.find(m => m.id === selectedMetric);

  return (
    <div className="chart-container">
      {/* TODO Change the original Chart Controls*/}
      {/* TODO Ask if we still even need this? */}
      <div className="chart-controls">
        <div className="control-group">
          <label>Metric:</label>
          <select 
            value={selectedMetric} 
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="metric-select"
          >
            {availableMetrics.map(metric => (
              <option key={metric.id} value={metric.id}>
                {metric.label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>View Type:</label>
          <select 
            value={visualizationType} 
            onChange={(e) => setVisualizationType(e.target.value)}
            className="visualization-select"
          >
            <option value="binned">Speed Bins</option>
            <option value="moving">Moving Average</option>
            <option value="sampled">Sampled Data</option>
          </select>
        </div>

        {visualizationType === 'binned' && (
          <div className="control-group">
            <label>Bin Size (km/h):</label>
            <input
              type="number"
              min="1"
              max="20"
              value={binSize}
              onChange={(e) => setBinSize(Number(e.target.value))}
              className="control-input"
            />
          </div>
        )}

        {visualizationType === 'moving' && (
          <div className="control-group">
            <label>Window Size:</label>
            <input
              type="number"
              min="10"
              max="200"
              step="10"
              value={windowSize}
              onChange={(e) => setWindowSize(Number(e.target.value))}
              className="control-input"
            />
          </div>
        )}

        {visualizationType === 'sampled' && (
          <div className="control-group">
            <label>Sample Rate:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={samplingRate}
              onChange={(e) => setSamplingRate(Number(e.target.value))}
              className="control-input"
            />
          </div>
        )}
      </div>
      <div className="chart-wrapper">
      {/*Ploty plot*/}
      <Plot
            data={[
              {
                x: processChartData.map(point => point.speed), // I think this may be an ISSUE
                y: processChartData.map(point => point.value),
                type: 'scatter',
                mode: 'lines', // Just lines, markers produce some clutter
                line: { width: 2 },
                marker: {color: selectedMetricConfig.color},
              },
            ]}
            layout={{ 
              margin: { t: 30, r: 30, l: 60, b: 35 }, 
              title: {text: `${selectedMetricConfig.label} vs Speed`, x: 0.5, xanchor: 'center'},
              yaxis: { title: { text: `${selectedMetricConfig.label} (${selectedMetricConfig.unit})` } },
              xaxis: { title: { text: 'Speed (km/h)' } },
              autosize: true, // Allow for autosizing with window
            }}
            config={{
              displayModeBar: false, // Removes plotly builtin in menu bar
              responsive: true, // Allows resizing
            }}
            useResizeHandler
            style={{ width: '100%', height: '100%' }}
          />
        {/* <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={processChartData}
            margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="speed"
              label={{
                value: 'Speed (km/h)',
                position: 'insideBottom',
                offset: -10
              }}
              tick={{ fontSize: 11 }}
              domain={['auto', 'auto']}
            />
            <YAxis
              label={{
                value: `${selectedMetricConfig.label} (${selectedMetricConfig.unit})`,
                angle: -90,
                position: 'insideLeft',
                offset: -45
              }}
              tick={{ fontSize: 11 }}
              padding={{ top: 20, bottom: 20 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{
                fontSize: '11px',
                paddingLeft: '40px'
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={selectedMetricConfig.color}
              name={selectedMetricConfig.label}
              dot={false}
              activeDot={{ r: 4 }}
              strokeWidth={2}
            />
            {visualizationType === 'binned' && (
              <Area
                dataKey={d => [d.min, d.max]}
                stroke="none"
                fill={selectedMetricConfig.color}
                fillOpacity={0.1}
              />
            )}
          </LineChart>
        </ResponsiveContainer> */}
      </div>
    </div>
  );
};

const displayMetrics = (result) => {
  if (!result || !result.engineType) return null;

  const getMetricsForType = (engineType) => {
    switch(engineType) {
      case 'ICEV':
      case 'HEV':
        return [
          { label: 'FUEL CONSUMPTION', value: result.total_fuel_liters, unit: 'L' },
          { label: 'FUEL ECONOMY', value: result.total_fuel_mpg, unit: 'MPG' },
          { label: 'ENERGY CONSUMED', value: result.total_energy_kWh, unit: 'kWh' }
        ];
      
      case 'BEV':
        return [
          { label: 'ENERGY CONSUMED', value: result.EE_consumed_kWh, unit: 'kWh' },
          { label: 'ENERGY RECOVERED', value: result.EE_recovered_kWh, unit: 'kWh' },
          { label: 'ENERGY EFFICIENCY', value: result.Energy_consumed_mile_per_kWh, unit: 'mi/kWh' },
          { label: 'BATTERY SOC', value: result.SOC_final_percent, unit: '%' }
        ];
      
      case 'HFCV':
        return [
          { label: 'ENERGY CONSUMED', value: result.total_energy_kWh, unit: 'kWh' },
          { label: 'ENERGY EFFICIENCY', value: result.total_energy_mile_per_kWh, unit: 'mi/kWh' }
        ];
      
      default:
        return [];
    }
  };

  const metrics = getMetricsForType(result.engineType).filter(metric => 
    metric.value !== undefined && metric.value !== null
  );

  return (
    <div className="metrics-grid">
      {metrics.map((metric, index) => (
        <MetricCard
          key={index}
          label={metric.label}
          value={metric.value}
          unit={metric.unit}
        />
      ))}
    </div>
  );
};

const EnergyVisualization = ({ estimationResults = {}, collection, viewMode }) => {
  const resultCount = Object.keys(estimationResults).length;
  
  const gridStyle = {
    display: 'grid',
    gap: '20px',
    gridTemplateColumns: resultCount === 2 ? '1fr 1fr' : resultCount === 4 ? '1fr 1fr' : '1fr',
    gridTemplateRows: resultCount === 4 ? 'auto auto' : 'auto',
    width: '100%'
  };

  const getAnalysisTitle = (engineType) => {
    const titles = {
      'ICEV': 'Internal Combustion Engine Vehicle',
      'BEV': 'Battery Electric Vehicle',
      'HEV': 'Hybrid Electric Vehicle',
      'HFCV': 'Hydrogen Fuel Cell Vehicle'
    };
    return titles[engineType] || 'Analysis Results';
  };

  return (
    <div className="visualization-container">
      <div className="results-grid" style={gridStyle}>
        {Object.entries(estimationResults).map(([id, result]) => (
          <div key={id} className="result-card">
            <h2 className="result-title">
              {getAnalysisTitle(result.engineType)}
            </h2>
            {viewMode === 'metrics' ? (
              displayMetrics(result)
            ) : (
              <EnergyChart 
                data={result}
                engineType={result.engineType}
                speedProfile={collection?.speed_profile}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

function Body({ isSidebarOpen }) {
  const { collectionId } = useParams();
  const [collection, setCollection] = useState(null);
  const [estimationResults, setEstimationResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('metrics');

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/collections/${collectionId}`);
        if (!response.ok) throw new Error('Failed to fetch collection');
        const data = await response.json();
        setCollection(data);
        
        const convertedResults = {};
        Object.entries(data.results || {}).forEach(([vehicleTypeId, result]) => {
          convertedResults[vehicleTypeId] = {
            ...result.result_data,
            engineType: result.vehicle_type
          };
        });
        setEstimationResults(convertedResults);
      } catch (error) {
        console.error('Error fetching collection:', error);
        setError('Failed to load collection data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (collectionId) {
      fetchCollection();
    }
  }, [collectionId]);

  const updateEstimationResult = (engineId, newResult) => {
    setEstimationResults(prev => {
      const updatedResults = { ...prev };
      if (newResult === null) {
        delete updatedResults[engineId];
      } else {
        updatedResults[engineId] = {
          ...newResult,
          engineType: newResult.engineType || 'Unknown'
        };
      }
      return updatedResults;
    });
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <p>Loading collection data...</p>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="body-container">
      <Sidebar
        isOpen={isSidebarOpen}
        setEstimationResult={updateEstimationResult}
        collectionId={collectionId}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      <div className={`body-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {collection && (
          <div className="collection-header">
            <h1>{collection.name}</h1>
            <p>{collection.description}</p>
          </div>
        )}
        <div className="results-wrapper">
          <EnergyVisualization 
            estimationResults={estimationResults}
            collection={collection}
            viewMode={viewMode}
          />
        </div>
      </div>
    </div>
  );
}

export default Body;