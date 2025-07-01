import './FileUpload.css';
import { FaDownload } from 'react-icons/fa';
import React, { useRef } from "react";

const FileUpload = () => {
  const fileInputRef = useRef();

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`File selected: ${file.name}`);
    }
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
    </div>
  );
};

export default FileUpload; 