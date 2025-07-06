import React, { useEffect, useState } from 'react';
import { fetchUserSummaries, deleteSummary } from '../api/api';
import FileUpload from '../components/Files/FileUpload';
import { useAuth } from '../contexts/AuthContext';
import { FaFileAlt, FaCalendar, FaUser, FaDownload, FaTrash, FaUsers } from 'react-icons/fa';
import './YourSummaries.css';

const YourSummaries = () => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  // For testing: use the actual user ID from the stored summaries
  const userId = user ? user.uid : '64S2rM9XFRZtNesIWdxvUxwyBO43';

  const loadSummaries = async () => {
    try {
      setLoading(true);
      const userSummaries = await fetchUserSummaries(userId);
      setSummaries(userSummaries);
      setError('');
    } catch (err) {
      console.error('Error loading summaries:', err);
      setError('Failed to load summaries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummaries();
  }, [userId]);

  const handleSummaryGenerated = () => {
    // Reload summaries when a new one is generated
    loadSummaries();
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

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteSummary = async (summaryId) => {
    try {
      await deleteSummary(summaryId);
      // Reload summaries after deletion
      loadSummaries();
    } catch (err) {
      console.error('Error deleting summary:', err);
      setError('Failed to delete summary. Please try again.');
    }
  };

  return (
    <div className="summaries-page">
      <div className="summaries-header">
        <h1 className="summaries-title">
          <FaFileAlt /> Your Summaries
        </h1>
        <p className="summaries-subtitle">
          Upload documents and generate AI-powered summaries to help you study more efficiently
        </p>
      </div>

      <div className="summaries-content">
        <div className="upload-section">
          <FileUpload onSummaryGenerated={handleSummaryGenerated} />
        </div>

        <div className="summaries-wall">
          <div className="summaries-wall-header">
            <h2 className="wall-title">
              <FaFileAlt /> Summary History
            </h2>
            <div className="wall-stats">
              <span className="stat-item">
                <FaFileAlt /> {summaries.length} summaries
              </span>
            </div>
          </div>

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your summaries...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={loadSummaries} className="retry-button">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && summaries.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3>No summaries yet</h3>
              <p>Upload your first document to generate a summary and see it appear here!</p>
            </div>
          )}

          {!loading && !error && summaries.length > 0 && (
            <div className="summaries-grid">
              {summaries.map((summary) => (
                <div key={summary.id} className="summary-card">
                  <div className="summary-card-header">
                    <div className="file-info">
                      <span className="file-icon">{getFileIcon(summary.filename)}</span>
                      <span className="file-name">{summary.filename}</span>
                    </div>
                    <div className="summary-actions">
                      <button 
                        className="action-button download"
                        title="Download original file"
                        onClick={() => window.open(`http://localhost:5001/download/${summary.filename}`, '_blank')}
                      >
                        <FaDownload />
                      </button>
                      <button 
                        className="action-button delete"
                        title="Delete summary"
                        onClick={() => handleDeleteSummary(summary.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  
                  <div className="summary-content">
                    <p>{summary.summary}</p>
                  </div>
                  
                  <div className="summary-meta">
                    <div className="meta-item">
                      <FaCalendar />
                      <span>{formatDate(summary.timestamp)}</span>
                    </div>
                    <div className="meta-item">
                      <FaUser />
                      <span>{summary.user_id}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YourSummaries; 