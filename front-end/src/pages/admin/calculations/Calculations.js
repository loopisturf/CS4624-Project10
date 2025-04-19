import React, { useState } from 'react';
import './Calculations.css';


export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [metricName, setMetricName] = useState('');
  const [metricUnits, setMetricUnits] = useState('');
  const [metricModel, setMetricModel] = useState('');


  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.py')) {
      setFile(selectedFile);
      setErrorMessage('');
    } else {
      setFile(null);
      setErrorMessage('Only Python (.py) files are allowed.');
    }
  };


  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
        alert("Please select a file first!");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await fetch('/api/admin/upload-calculation', {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (response.ok) {
            console.log("Upload Response:", data);
            alert(data.message);
        } else {
            console.error("Upload Error:", data.error);
            alert(data.error || "Upload failed!");
        }
    } catch (error) {
        console.error("Error uploading file:", error);
        alert("Upload failed!");
    }
};

const handleDownloadTemplate = () => {
    fetch('/static/template.py')
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template.py';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => console.error('Error downloading file:', error));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!metricName || !metricUnits || !metricModel) {
      setErrorMessage('Please fill in all the fields and upload the template file.');
      return;
    }
  
    try {
      const response = await fetch('/api/metrics');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const metrics = await response.json();
      const exists = metrics.some(metric => metric.valueKey === metricModel);
  
      if (exists) {
        console.error('Model name already exists, choose another one');
        alert('Model name already exists, choose another one');
        return; // Stop submission
      }
  
      // Create the data to send to the server
      const formData = new FormData();
      formData.append('metricName', metricName);
      formData.append('metricUnits', metricUnits);
      formData.append('metricModel', metricModel);
  
      const submitResponse = await fetch('/api/metrics', {
        method: 'POST',
        body: formData,
      });
  
      if (!submitResponse.ok) {
        throw new Error('Failed to submit metric');
      }
  
      alert('Metric submitted successfully!');
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage(error.message || 'Something went wrong!');
    }
  };

  return (
        <>
        <hr className="section-divider" />
        <h2 className="main-section-title">Add a New Metric</h2>
        <div className="section-title">
        <ul className="section-list">
            <li>Input the name and units for the metric.</li>
            <li>Download the Python template file to add a new calculation.</li>
            <li>Upload the completed template to then be able to see your metric in the collections visualization dashboard.</li>
            <li>Click "Submit Metric" Button.</li>
        </ul>
        </div>
        <div className="input-wrapper">
            <label htmlFor="metric-name" className="upload-label">
                Enter a name for the new metric
            </label>
            <input
                type="text"
                id="metric-name"
                className="text-input"
                value={metricName}
                onChange={(e) => setMetricName(e.target.value)}
        />
        </div>
            <div className="input-wrapper">
            <label htmlFor="metric-units" className="upload-label">
                Enter the units for the new metric
            </label>
            <input
                type="text"
                id="metric-units"
                className="text-input"
                value={metricUnits}
                onChange={(e) => setMetricUnits(e.target.value)}
        />
        </div>
        <div className="input-wrapper">
            <label htmlFor="metric-vehicles" className="upload-label">
                Enter a unique model name that matches the one in the template file
            </label>
            <input
                type="text"
                id="metric-vehicle"
                className="text-input"
                value={metricModel}
                onChange={(e) => setMetricModel(e.target.value)}
        />
        </div>
       <div className="vehicles-content">

              <div className="upload-container">
                  <form onSubmit={handleDownloadTemplate}>
                      <div className="upload-content">
                          <div className="upload-text">
                              <span>Click to download the .py template file that you can fill out to add a new calculation</span>
                              <br />
                          </div>
                          {errorMessage && <div className="error-message">{errorMessage}</div>}
                      </div>


                      <button type="submit" className="type_name vt-orange">
                          Download Template File
                      </button>
                  </form>
              </div>


              <div className="upload-container">
                  <form onSubmit={handleUpload}>
                      <div className="upload-content">
                          <label className="upload-label" htmlFor="file-input">
                              <div className="upload-icon">📂</div>
                              <div className="upload-text">
                                  <span>Click to upload your completed template file</span>
                                  <span className="file-type">.py file only</span>
                              </div>
                          </label>
                          <input
                              type="file"
                              id="file-input"
                              className="file-input"
                              onChange={handleFileChange}
                              accept=".py" />
                          {file && <p>Selected File: {file.name}</p>}
                          {errorMessage && <div className="error-message">{errorMessage}</div>}
                      </div>


                      <button type="submit" className="type_name vt-orange">
                          Upload File
                      </button>
                  </form>
              </div>
          </div>
          <div className="submit-container">
            <button onClick={handleSubmit} className="submit-button">
                Submit Metric
            </button>
          </div>
        </>
  );
}