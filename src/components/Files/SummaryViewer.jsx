import './SummaryViewer.css';

const summary = `This is a summary of the uploaded file. It provides key points and important information for group study.`;

const SummaryViewer = () => (
  <div className="summary-viewer-container">
    <h3 className="summary-viewer-title">Summary</h3>
    <p className="summary-viewer-content">{summary}</p>
  </div>
);

export default SummaryViewer; 