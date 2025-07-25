import './FileList.css';
import { FaDownload } from 'react-icons/fa';
import FileUpload from './FileUpload';
import BackButton from '../BackButton';

// No preloaded files
const files = [];

const FileList = ({ groupId = null }) => (
  <>
    <BackButton />
    <div className="file-list-container">
      <FileUpload groupId={groupId} />
      <h3 className="file-list-title">Uploaded Files</h3>
      <ul className="file-list-list">
        {files.length === 0 ? (
          <li className="file-list-item-empty">No files uploaded yet.</li>
        ) : (
          files.map(file => (
            <li className="file-list-item" key={file.id}>
              <span>{file.name}</span>
              <button className="file-list-download"><FaDownload /> Download</button>
            </li>
          ))
        )}
      </ul>
    </div>
  </>
);

export default FileList; 