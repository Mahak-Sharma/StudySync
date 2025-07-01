import './FileList.css';
import { FaDownload } from 'react-icons/fa';

const files = [
  { id: 1, name: "Lecture1.pdf" },
  { id: 2, name: "Notes.docx" },
  { id: 3, name: "Summary.txt" },
];

const FileList = () => (
  <div className="file-list-container">
    <h3 className="file-list-title">Uploaded Files</h3>
    <ul className="file-list-list">
      {files.map(file => (
        <li className="file-list-item" key={file.id}>
          <span>{file.name}</span>
          <button className="file-list-download"><FaDownload /> Download</button>
        </li>
      ))}
    </ul>
  </div>
);

export default FileList; 