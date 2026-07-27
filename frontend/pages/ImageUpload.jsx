import React, { useId, useState } from 'react';

const ImageUpload = ({ 
  onImageSelect, 
  currentImage = '', 
  label = 'Upload Image',
  maxSize = 5, // MB
  required = false
}) => {
  const inputId = useId();
  const [preview, setPreview] = useState(currentImage);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const MAX_FILE_SIZE = maxSize * 1024 * 1024; // Convert MB to bytes
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  const validateFile = (file) => {
    setError('');

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only image files are allowed (JPEG, PNG, GIF, WebP)');
      return false;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file) => {
    if (!validateFile(file)) {
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('No file selected');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/upload/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onImageSelect({
          url: data.imageUrl,
          file: selectedFile
        });
        // Clear file selection after successful upload, but keep preview
        setSelectedFile(null);
        setPreview(data.imageUrl);
        setError('');
      } else {
        setError(data.message || 'Failed to upload image');
        setSelectedFile(null);
        setPreview(currentImage);
      }
    } catch (err) {
      setError('Network error: ' + err.message);
      setSelectedFile(null);
      setPreview(currentImage);
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(currentImage);
    setError('');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Drag and drop area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-orange-500 bg-orange-50'
            : 'border-gray-300 hover:border-orange-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          disabled={uploading}
          className="hidden"
          id={inputId}
        />
        <label
          htmlFor={inputId}
          className="cursor-pointer block"
        >
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-600 font-medium">
            {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            PNG, JPG, GIF, WebP up to {maxSize}MB
          </p>
        </label>
      </div>

      {/* Preview */}
      {preview && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
          <img
            src={preview}
            alt="Preview"
            className="max-w-xs h-auto rounded-lg border border-gray-300 object-cover"
          />
          {selectedFile && !uploading && (
            <p className="text-xs text-gray-500 mt-2">
              File: {selectedFile.name}
            </p>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      {selectedFile && !uploading && (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={handleUpload}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Upload Image
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* Success message */}
      {preview && !selectedFile && !error && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">✓ Image ready to submit</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
