import './FileUpload.css';
import { FaDownload, FaFileUpload, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import React, { useRef, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

// Use the same summarization base URL as in api.js
const API_URL = import.meta.env.VITE_SUMMARIZATION_BASE_URL || "http://localhost:5000";

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'bmp', 'tiff'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const FileUpload = ({ groupId = null, onSummaryGenerated = null }) => {
  const fileInputRef = useRef();
  const [selectedFile, setSelectedFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { user } = useAuth();

  const validateFile = (file) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Check file extension
    const extension = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return `File type not supported. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()}`;
    }

    return null;
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setSummary("");
    setUploadedFilename("");
    setError("");
    setSuccess("");
  };

  const handleGenerateSummary = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    setSummary("");
    setError("");
    setSuccess("");
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('user_id', user ? user.uid : '64S2rM9XFRZtNesIWdxvUxwyBO43');
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
          setSuccess('Summary generated successfully!');
          // Call the callback to notify parent component
          if (onSummaryGenerated) {
            onSummaryGenerated();
          }
        } else {
          setError(data.error || 'Failed to generate summary.');
        }
    } catch (err) {
      setError('Server error. Please try again.');
      console.error('Upload error:', err);
    }
    
    setLoading(false);
  };

  const handleDownload = () => {
    if (!uploadedFilename) return;
    window.open(`${API_URL}/download/${uploadedFilename}`, '_blank');
  };

  const clearAll = () => {
    setSelectedFile(null);
    setSummary("");
    setUploadedFilename("");
    setError("");
    setSuccess("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'docx': return '📝';
      case 'txt': return '📄';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'bmp':
      case 'tiff': return '🖼️';
      default: return '📁';
    }
  };

  return (
    <div className="file-upload-container">
      <h3 className="file-upload-title">Upload File for Summarization</h3>
      
      <div className="file-upload-info">
        <p><strong>Supported formats:</strong> PDF, DOCX, TXT, PNG, JPG, JPEG, BMP, TIFF</p>
        <p><strong>Maximum file size:</strong> 10MB</p>
      </div>

      <input
        className="file-upload-input"
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept={ALLOWED_EXTENSIONS.map(ext => `.${ext}`).join(',')}
      />
      
      <button
        className="file-upload-button"
        onClick={handleUploadClick}
        disabled={loading}
      >
        <FaFileUpload /> Select File
      </button>

      {selectedFile && (
        <div className="file-selected">
          <div className="file-info">
            <span className="file-icon">{getFileIcon(selectedFile.name)}</span>
            <span className="file-name">{selectedFile.name}</span>
            <span className="file-size">({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
          
          <div className="file-actions">
            <button
              className="file-upload-button primary"
              onClick={handleGenerateSummary}
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="spinner" /> Generating Summary...
                </>
              ) : (
                <>
                  <FaDownload /> Generate Summary
                </>
              )}
            </button>
            
            <button
              className="file-upload-button secondary"
              onClick={clearAll}
              disabled={loading}
            >
              <FaTimes /> Clear
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="success-message">
          <FaCheck /> {success}
        </div>
      )}

      {error && (
        <div className="error-message">
          <FaTimes /> {error}
        </div>
      )}

      {uploadedFilename && (
        <div className="download-section">
          <button
            className="file-upload-button"
            onClick={handleDownload}
          >
            <FaDownload /> Download Original File
          </button>
        </div>
      )}

      {summary && (
        <div className="summary-section">
          <h4>Generated Summary:</h4>
          <div className="summary-content">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 