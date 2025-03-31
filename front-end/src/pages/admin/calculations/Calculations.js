import React, { useState } from 'react';
import './Calculations.css';

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
        alert("Please select a file first!");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folderName", "calculations"); 

    try {
        const response = await fetch('/api/admin/upload-calculation', {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        console.log("Upload Response:", data);
        alert(data.message);
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

  return (
    <div className="vehicles-content">
      <div className="section-title">Download Python Template File</div>
      <p className="section-description">
        Download the python template file to add a new calculation 
      </p>

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
        <form onSubmit={handleSubmit}>
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
              accept=".py"
            />
            {file && <p>Selected File: {file.name}</p>}
            {errorMessage && <div className="error-message">{errorMessage}</div>}
          </div>

          <button type="submit" className="type_name vt-orange">
            Upload File
          </button>
        </form>
      </div>
    </div>
  );
}
