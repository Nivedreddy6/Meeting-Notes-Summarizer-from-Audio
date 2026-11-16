import React, { useRef, useState } from 'react';
import { UploadCloud, Music, X } from 'lucide-react';
import { formatBytes } from '../utils/exportUtils';

export default function AudioUploader({ selectedFile, onFileSelect, onRemoveFile }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files.length) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="input-card tab-panel active">
      <div
        className={`drop-zone ${isDragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm,.flac"
          hidden
        />
        <div className="drop-zone-icon">
          <UploadCloud size={44} />
        </div>
        <h3>Drag & Drop Meeting Audio</h3>
        <p className="drop-desc">
          Supports MP3, WAV, M4A, AAC, OGG, WEBM, FLAC (Direct Multimodal Audio)
        </p>

        <button
          className="btn-primary"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          Browse Audio File
        </button>

        {selectedFile && (
          <div className="file-pill">
            <Music size={16} />
            <span>{selectedFile.name}</span>
            <span className="size-badge">{formatBytes(selectedFile.size)}</span>
            <button
              className="close-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFile();
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              title="Remove"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
