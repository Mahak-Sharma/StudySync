import './FileUpload.css';
import { FaDownload } from 'react-icons/fa';
import React, { useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const API_URL = 'http://localhost:5001'; // Summarization backend runs on port 5001

const FileUpload = ({ groupId = null }) => {
  const fileInputRef = useRef();
  const [selectedFile, setSelectedFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setSummary("");
    setUploadedFilename("");
    setError("");
  };

  const handleGenerateSummary = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setSummary("");
    setError("");
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('user_id', user ? user.uid : 'demo-user');
    formData.append('group_id', groupId);
    try {
      const res = await fetch(`${API_URL}/summarize`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
        setUploadedFilename(data.filename);
      } else {
        setError(data.error || 'Failed to generate summary.');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    }
    setLoading(false);
  };

  const handleDownload = () => {
    if (!uploadedFilename) return;
    window.open(`${API_URL}/download/${uploadedFilename}`, '_blank');
  };

  return (
    <div className="file-upload-container">
      <h3 className="file-upload-title">Upload File</h3>
      <input
        className="file-upload-input"
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button
        className="file-upload-button"
        onClick={handleUploadClick}
      >
        <FaDownload /> Select File
      </button>
      {selectedFile && (
        <div style={{ marginTop: 12 }}>
          <div><b>Selected:</b> {selectedFile.name}</div>
          <button
            className="file-upload-button"
            style={{ marginTop: 10 }}
            onClick={handleGenerateSummary}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Summary'}
          </button>
        </div>
      )}
      {uploadedFilename && (
        <button
          className="file-upload-button"
          style={{ marginTop: 10 }}
          onClick={handleDownload}
        >
          <FaDownload /> Download File
        </button>
      )}
      {summary && (
        <div style={{ marginTop: 18, background: '#f7f8fa', padding: 16, borderRadius: 8, textAlign: 'left' }}>
          <b>Summary:</b>
          <div style={{ marginTop: 8 }}>{summary}</div>
        </div>
      )}
      {error && (
        <div style={{ color: 'red', marginTop: 10 }}>{error}</div>
      )}
    </div>
  );
};

export default FileUpload; 