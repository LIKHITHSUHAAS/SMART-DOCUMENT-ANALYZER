import { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function FileUpload({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState('idle'); // idle, uploading, success, error
  const [message, setMessage] = useState('');
  const [activeFile, setActiveFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFiles(files[0]);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0) handleFiles(files[0]);
  };

  const handleFiles = async (file) => {
    setUploadState('uploading');
    setMessage(`Uploading ${file.name}...`);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        if (response.data.status === 'success') {
            setUploadState('success');
            setActiveFile(file.name);
            setMessage('Document trained successfully!');
            onUploadSuccess && onUploadSuccess(file.name);
            // Removed automatic reset to keep success message visible
        } else {
            setUploadState('error');
            setMessage(response.data.message || 'Warning during upload');
        }
    } catch (error) {
        console.error(error);
        setUploadState('error');
        setMessage(error.message || 'Failed to upload document');
        setTimeout(() => setUploadState('idle'), 5000);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: 'var(--accent)' }}>Document Vault</h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Upload your PDFs or images to build your local knowledge base.
      </p>

      <div 
        className={`upload-zone ${isDragging ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileInput}
          accept=".pdf,.png,.jpg,.jpeg"
        />
        
        {uploadState === 'idle' && (
          <>
            <UploadCloud className="upload-icon" />
            <p style={{ fontWeight: 500 }}>Click or drag a file to this area</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDFs, PNG, JPG supported</p>
          </>
        )}

        {uploadState === 'uploading' && (
          <>
            <Loader2 className="upload-icon" style={{ animation: 'spin 2s linear infinite' }} />
            <p style={{ color: 'var(--primary)' }}>{message}</p>
          </>
        )}

        {uploadState === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle className="upload-icon" style={{ color: '#10b981', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.4' }}>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>"{activeFile}"</span> has uploaded successfully and you may ask any questions on this.
            </p>
            <button 
              onClick={(e) => { e.stopPropagation(); setUploadState('idle'); }}
              style={{ 
                marginTop: '16px', 
                background: 'transparent', 
                border: '1px solid var(--glass-border)', 
                color: 'var(--text-muted)',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Upload another
            </button>
          </div>
        )}

        {uploadState === 'error' && (
          <>
            <AlertCircle className="upload-icon" style={{ color: '#ef4444' }} />
            <p style={{ color: '#ef4444' }}>{message}</p>
          </>
        )}
      </div>
      
      <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <File size={14} /> 100% locally embedded processing
        </p>
      </div>
    </div>
  );
}
