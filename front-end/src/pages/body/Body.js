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


const getProcessValueMap = () => ({
    fuel_rate: (v) => Math.abs(Number(v)),
    fuel_economy: (v, speed) => speed > 0 ? (0.621371 / (v * 3.6)) : 0,
    power: (v) => Math.abs(Number(v)),
    energy_efficiency: (v, speed) => speed > 0 ? (0.621371 * speed) / (Math.abs(v) * 3600) : 0,
    fuel_energy: (v) => Math.abs(Number(v)) * 9.3127778,
    unknown: (v) => Number(v),
  });
  
  const getAvailableMetrics = async (engineType, allVehicles = false) => {
    const metrics = [];
    const processValueMap = getProcessValueMap();
  
    // Don't proceed if neither an engineType is passed nor allVehicles is true
    if (!engineType && !allVehicles) return metrics;
  
    try {
      const url = '/api/metrics'; // no query parameters anymore
  
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.statusText}`);
  
      const dbMetrics = await res.json();
  
      for (const dbMetric of dbMetrics) {
        const { id, label, unit, color, valueKey } = dbMetric;
  
        const processValue = processValueMap[id] || processValueMap['unknown'];
  
        metrics.push({ id, label, unit, color, valueKey, processValue });
      }
  
      return metrics;
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      return [];
    }
  };

  async function getValueKeyById(id) {
    try {
        const idParam = encodeURIComponent(id);
        const response = await fetch(`/api/get_metric?id=${idParam}`);
        
        const data = await response.json();

        if (response.ok) {
            return data.valueKey; 
        } else {
            console.error('Error fetching metric:', data.error);
            return null;
        }
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

const EnergyChart = ({ data, engineType, speedProfile }) => {
    const [availableMetrics, setAvailableMetrics] = useState([]);
    const [selectedMetric, setSelectedMetric] = useState('');
    const [visualizationType, setVisualizationType] = useState('binned');
    const [binSize, setBinSize] = useState(1);
    const [windowSize, setWindowSize] = useState(1); // assuming you had a default
    const [samplingRate, setSamplingRate] = useState(10);
    const [processChartData, setProcessedChartData] = useState([]);

    useEffect(() => {
        const fetchMetrics = async () => {
        if (!engineType) return;

        const metrics = await getAvailableMetrics(engineType);
        setAvailableMetrics(metrics);

        if (metrics.length > 0) {
            setSelectedMetric(metrics[0].id);
        }
        };

        fetchMetrics();
    }, [engineType]);

    useEffect(() => {
        const processChartData = async () => {
            if (!data?.model || !speedProfile || !selectedMetric) {
                setProcessedChartData([]);
                return;
            }
            const metricConfig = availableMetrics.find(m => m.id === selectedMetric);
            if (!metricConfig) {
                setProcessedChartData([]);
                return;
            }
    
            const getFilteredEstimationDataSeperate = async (estimationResults, config) => {
                const filtered = {};
                const selectedUnit = config.unit;
                const id = config.id;
                const engineResult = estimationResults;

                console.log("ESTIMATION")
                console.log(estimationResults)

                // if (engineResult[selectedUnit] !== undefined && engineResult[selectedUnit] !== 0) {
                //     filtered[selectedUnit] = engineResult[selectedUnit];
                // }
    
                if (engineResult[selectedUnit] !== undefined) {
                    if (engineResult[selectedUnit] === 0) {
                        return filtered;  
                    }
                    filtered[selectedUnit] = engineResult[selectedUnit];
                    const model_str = await getValueKeyById(id);
                    filtered.model = engineResult[model_str];
                }
    
                return filtered;
            };
    
            const newData = await getFilteredEstimationDataSeperate(data, metricConfig);
            // if (Object.keys(newData).length === 0) {
            //     return <div className="no-data-message">No data available for visualization</div>;
            // }
            console.log("NEW DATA")
            console.log(newData)
    
            let result = [];
    
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

                            // Check if newData is empty and set the flag accordingly
                            if (Object.keys(newData).length != 0) {
                                const value = metricConfig.processValue(newData.model[index], speed);
                                if (!isNaN(value) && isFinite(value)) {
                                    const bin = binnedData.get(binKey);
                                    bin.values.push(value);
                                    bin.count++;
                                }
                            }
                        }
                    });
    
                    result = Array.from(binnedData.entries())
                        .map(([speed, bin]) => ({
                            speed,
                            value: bin.values.reduce((sum, val) => sum + val, 0) / bin.count,
                            min: Math.min(...bin.values),
                            max: Math.max(...bin.values),
                            count: bin.count
                        }))
                        .filter(point => point.count > 0)
                        .sort((a, b) => a.speed - b.speed);
                    break;
                }
    
                case 'moving': {
                    const validPoints = speedProfile
                        .map((speed, index) => ({
                            speed,
                            value: metricConfig.processValue(newData.model[index], speed)
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
    
                    result = movingAverage.sort((a, b) => a.speed - b.speed);
                    break;
                }
    
                case 'sampled': {
                    result = speedProfile
                        .filter((_, index) => index % samplingRate === 0)
                        .map((speed, index) => ({
                            speed,
                            value: metricConfig.processValue(newData.model[index * samplingRate], speed)
                        }))
                        .filter(point => point.speed > 0 && !isNaN(point.value) && isFinite(point.value))
                        .sort((a, b) => a.speed - b.speed);
                    break;
                }
    
                default:
                    result = [];
            }
    
            setProcessedChartData(result);
        };
    
        processChartData();
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
    // console.log("SELECTED METRIC")
    // console.log(selectedMetric)
    // console.log(processChartData)
    // console.log(processChartData.length)
    if (!selectedMetric) {
        return <div className="no-data-message">No data available for visualization</div>;
    }

    const selectedMetricConfig = availableMetrics.find(m => m.id === selectedMetric);
    return (
        <div className="chart-container">
          {/* Chart Controls: always visible */}
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
      
          {/* Chart or No Data Message */}
          <div className="chart-wrapper">
            {Array.isArray(processChartData) && processChartData.length === 0 ? (
              <div className="no-data-message">No data available for visualization</div>
            ) : (
              <Plot
                data={[
                  {
                    x: processChartData?.map(point => point.speed) || [],
                    y: processChartData?.map(point => point.value) || [],
                    type: 'scatter',
                    mode: 'lines',
                    line: { width: 2 },
                    marker: { color: selectedMetricConfig?.color || 'black' },
                  }
                ]}
                layout={{
                  margin: { t: 30, r: 30, l: 60, b: 35 },
                  title: {
                    text: `${selectedMetricConfig?.label || 'Metric'} vs Speed`,
                    x: 0.5,
                    xanchor: 'center',
                  },
                  yaxis: {
                    title: {
                      text: `${selectedMetricConfig?.label || 'Metric'} (${selectedMetricConfig?.unit || ''})`
                    }
                  },
                  xaxis: { title: { text: 'Speed (km/h)' } },
                  autosize: true,
                }}
                config={{ displayModeBar: false, responsive: true }}
                useResizeHandler
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </div>
        </div>
    );
};

const CombinedEnergyChart = ({ estimationResults, collection }) => {
    const [availableMetrics, setAvailableMetrics] = useState([]);
    const [selectedMetric, setSelectedMetric] = useState('');
    const [visualizationType, setVisualizationType] = useState('binned');
    const [binSize, setBinSize] = useState(5);
    const [windowSize, setWindowSize] = useState(50);
    const [samplingRate, setSamplingRate] = useState(10);
    const [combinedData, setCombinedData] = useState([]);

    
    const validEnginesArray = useMemo(
      () => Object.values(estimationResults).filter(engine => engine != null),
      [estimationResults]
    );
    const firstEngine = validEnginesArray[0];
    
    useEffect(() => {
        const fetchMetrics = async () => {
          if (!firstEngine?.model) {
            setAvailableMetrics([]);
            return;
          }
        
          // Assuming you want to pass the flag based on some condition
          const allVehiclesFlag = true; // or false, depending on your condition
          
          const metrics = await getAvailableMetrics(firstEngine.model, allVehiclesFlag); // async call with flag
          setAvailableMetrics(metrics);
        
          // Auto-select first metric if none is selected
          if (metrics.length > 0 && !selectedMetric) {
            setSelectedMetric(metrics[0].id);
          }
        };
      
        fetchMetrics();
      }, [firstEngine, selectedMetric]); // re-runs when `firstEngine` or `selectedMetric` changes

    useEffect(() => {
      // This ensures selectedMetric stays in sync with new availableMetrics
      if (availableMetrics.length > 0 && !selectedMetric) {
        setSelectedMetric(availableMetrics[0].id);
      }
    }, [availableMetrics, selectedMetric]);

    const getFilteredEstimationData = async (estimationResults, config) => {
        const filtered = {};
        const selectedUnit = config.unit
        const id = config.id
        const model_str = await getValueKeyById(id);
        
        Object.entries(estimationResults)
            .filter(([_, engineResult]) => engineResult != null)
            .forEach(([engineId, engineResult]) => {
            if (engineResult[selectedUnit] !== undefined) {
                filtered[engineId] = {
                model: engineResult[model_str],
                [selectedUnit]: engineResult[selectedUnit]
                };
            }
            });
        
        return filtered;
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!collection?.speed_profile || !selectedMetric) return;
    
            const mergedData = {};
            const speedProfile = collection.speed_profile;
            const metricConfig = availableMetrics.find(m => m.id === selectedMetric);
    
            // console.log("METRIC CONFIG");
            // console.log(metricConfig);
            // console.log("ESTIMATION");
            // console.log(estimationResults);
    
            if (!metricConfig) return;
    
            try {
                const filteredEstimation = await getFilteredEstimationData(estimationResults, metricConfig);
                // console.log("FILTERED");
                // console.log(filteredEstimation);
    
                Object.entries(filteredEstimation)
                    .filter(([id, engineResult]) => engineResult != null)
                    .forEach(([engineId, engineResult]) => {
                        let processed = [];
    
                        switch (visualizationType) {
                            case 'binned': {
                                const binnedData = new Map();
                                speedProfile.forEach((speed, index) => {
                                    if (speed > 0) {
                                        const binKey = Math.floor(speed / binSize) * binSize;
                                        if (!binnedData.has(binKey)) {
                                            binnedData.set(binKey, { values: [], count: 0 });
                                        }
                                        const value = metricConfig.processValue(engineResult.model[index], speed);
                                        if (!isNaN(value) && isFinite(value)) {
                                            const bin = binnedData.get(binKey);
                                            bin.values.push(value);
                                            bin.count++;
                                        }
                                    }
                                });
                                processed = Array.from(binnedData.entries()).map(([speed, bin]) => ({
                                    speed,
                                    value: bin.values.reduce((sum, v) => sum + v, 0) / bin.count,
                                    count: bin.count
                                }));
                                break;
                            }
                            case 'moving': {
                                const validPoints = speedProfile
                                    .map((speed, index) => ({
                                        speed,
                                        value: metricConfig.processValue(engineResult.model[index], speed)
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
                                processed = movingAverage;
                                break;
                            }
                            case 'sampled': {
                                processed = speedProfile
                                    .filter((_, index) => index % samplingRate === 0)
                                    .map((speed, index) => ({
                                        speed,
                                        value: metricConfig.processValue(engineResult.model[index * samplingRate], speed)
                                    }))
                                    .filter(point => point.speed > 0 && !isNaN(point.value) && isFinite(point.value));
                                break;
                            }
                            default:
                                processed = [];
                        }
    
                        processed.forEach(point => {
                            if (!mergedData[point.speed]) {
                                mergedData[point.speed] = { speed: point.speed };
                            }
                            mergedData[point.speed][engineId] = point.value;
                        });
                    });
    
                setCombinedData(Object.values(mergedData).sort((a, b) => a.speed - b.speed));
            } catch (error) {
                console.error("Error fetching filtered estimation data:", error);
            }
        };
    
        fetchData();
    }, [
        estimationResults,
        collection,
        selectedMetric,
        visualizationType,
        binSize,
        windowSize,
        samplingRate,
        availableMetrics
    ]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="custom-tooltip">
        <p>Speed: {label} km/h</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.stroke }}>
            {entry.name}: {entry.value.toFixed(4)}
          </p>
        ))}
      </div>
    );
  };

  if (validEnginesArray.length === 0) {
    return <div className="no-data-message">No engine selected for combined analysis</div>;
  }
  if (!selectedMetric || combinedData.length === 0) {
    return <div className="no-data-message">No data available for combined visualization</div>;
  }

  return (
    <div className="chart-container">
      <div className="chart-controls">
        <div className="control-group">
          <label>Metric:</label>
          <select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)} className="metric-select">
            {availableMetrics.map(metric => (
              <option key={metric.id} value={metric.id}>{metric.label}</option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>View Type:</label>
          <select value={visualizationType} onChange={(e) => setVisualizationType(e.target.value)} className="visualization-select">
            <option value="binned">Speed Bins</option>
            <option value="moving">Moving Average</option>
            <option value="sampled">Sampled Data</option>
          </select>
        </div>
        {visualizationType === 'binned' && (
          <div className="control-group">
            <label>Bin Size (km/h):</label>
            <input type="number" min="1" max="20" value={binSize} onChange={(e) => setBinSize(Number(e.target.value))} className="control-input" />
          </div>
        )}
        {visualizationType === 'moving' && (
          <div className="control-group">
            <label>Window Size:</label>
            <input type="number" min="10" max="200" step="10" value={windowSize} onChange={(e) => setWindowSize(Number(e.target.value))} className="control-input" />
          </div>
        )}
        {visualizationType === 'sampled' && (
          <div className="control-group">
            <label>Sample Rate:</label>
            <input type="number" min="1" max="100" value={samplingRate} onChange={(e) => setSamplingRate(Number(e.target.value))} className="control-input" />
          </div>
        )}
        {/* <div className="control-group">
          <button className="add-metric-button" onClick={() => alert("Add New Metric clicked")}>
            Add New Metric
          </button>
        </div> */}
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="speed"
              label={{ value: 'Speed (km/h)', position: 'insideBottom', offset: -10 }}
              tick={{ fontSize: 11 }}
              domain={['auto', 'auto']}
            />
            <YAxis
              label={{
                value:
                  availableMetrics.find(m => m.id === selectedMetric)?.label +
                  ' (' +
                  availableMetrics.find(m => m.id === selectedMetric)?.unit +
                  ')',
                angle: -90,
                position: 'insideLeft',
                offset: -45
              }}
              tick={{ fontSize: 11 }}
              padding={{ top: 20, bottom: 20 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', paddingLeft: '40px' }} />
            {Object.keys(estimationResults)
              .filter(pid => estimationResults[pid] != null)
              .map((pid, index) => {
                const colors = ['#e63946', '#457b9d', '#2a9d8f', '#f4a261', '#8b1e3f'];
                const color = colors[index % colors.length];
                return (
                  <Line
                    key={pid}
                    type="monotone"
                    dataKey={pid}
                    stroke={color}
                    name={estimationResults[pid].label}
                    dot={false}
                    activeDot={{ r: 4 }}
                    strokeWidth={2}
                  />
                );
              })}
          </LineChart>
        </ResponsiveContainer>
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
        console.log("RESPONSE")
        console.log(data.results)

        setCollection(data);
        
        const convertedResults = {};
        Object.entries(data.results || {}).forEach(([paramId, result]) => {
          const rd = result.result_data;
          convertedResults[paramId] = {
            ...rd,
            make: rd.make,
            model: rd.model,
            year: rd.year,
            label: `${rd.make} ${rd.model} (${rd.year})`
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
    // console.log("results")
    // console.log(newResult)
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
          {viewMode === 'combined' ? (
            <CombinedEnergyChart estimationResults={estimationResults} collection={collection} />
          ) : viewMode === 'charts' ? (
            Object.entries(estimationResults)
              .filter(([id, result]) => result != null)
              .map(([id, result]) => (
                <div key={id} className="result-card">
                  <h2 className="result-title">{result.label}</h2>
                  <EnergyChart
                    data={result}
                    engineType={result.label}
                    speedProfile={collection?.speed_profile}
                  />
                </div>
              ))
          ) : (
            <div className="metrics-grid">
              {Object.entries(estimationResults)
                .filter(([id, result]) => result != null)
                .map(([id, result]) => (
                  <MetricCard
                    key={id}
                    label={result.label}
                    value={result.total_energy_kWh || 0}
                    unit="kWh"
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Body;
