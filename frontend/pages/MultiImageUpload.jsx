import React, { useId, useState, useEffect } from 'react';

const MultiImageUpload = ({ 
  onImagesSelect, 
  currentImages = [], 
  label = 'Upload Images',
  maxSize = 5, // MB
  maxImages = 5,
  required = false
}) => {
  const inputId = useId();
  const [previews, setPreviews] = useState(currentImages);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Update previews when currentImages prop changes (for edit mode)
  useEffect(() => {
    setPreviews(currentImages);
  }, [currentImages]);

  const MAX_FILE_SIZE = maxSize * 1024 * 1024; // Convert MB to bytes
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  const validateFile = (file) => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only image files are allowed (JPEG, PNG, GIF, WebP)';
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    return null;
  };

  const handleFilesSelect = (files) => {
    const newPreviews = [...previews];
    const newFiles = [...selectedFiles];
    const errors = [];

    Array.from(files).forEach((file) => {
      if (newPreviews.length >= maxImages) {
        errors.push(`Maximum ${maxImages} images allowed`);
        return;
      }

      const error = validateFile(file);
      if (error) {
        errors.push(error);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        setPreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);

      newFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors[0]);
    } else {
      setError('');
    }

    setSelectedFiles(newFiles);
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files) {
      handleFilesSelect(files);
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

    const files = e.dataTransfer.files;
    if (files) {
      handleFilesSelect(files);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('No files selected');
      return;
    }

    setUploading(true);
    setError('');

    const uploadedUrls = [];
    let hasError = false;

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('image', file);

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
          uploadedUrls.push(data.imageUrl);
        } else {
          setError(data.message || 'Failed to upload some images');
          hasError = true;
          break;
        }
      } catch (err) {
        setError('Network error: ' + err.message);
        hasError = true;
        break;
      }
    }

    if (!hasError && uploadedUrls.length > 0) {
      const allImages = [...currentImages, ...uploadedUrls];
      onImagesSelect(allImages);
      setPreviews(allImages);
      setSelectedFiles([]);
      setError('');
    }

    setUploading(false);
  };

  const removePreview = (index) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);

    // If it's a new image (not from currentImages), remove from selectedFiles
    if (index >= currentImages.length) {
      const fileIndex = index - currentImages.length;
      const newFiles = selectedFiles.filter((_, i) => i !== fileIndex);
      setSelectedFiles(newFiles);
    }

    onImagesSelect(newPreviews.slice(0, currentImages.length).concat(
      newPreviews.slice(currentImages.length)
    ));
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setPreviews(currentImages);
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
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
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
            PNG, JPG, GIF, WebP up to {maxSize}MB each ({previews.length}/{maxImages} uploaded)
          </p>
        </label>
      </div>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Images ({previews.length}/{maxImages})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 rounded-lg border border-gray-300 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePreview(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      {selectedFiles.length > 0 && !uploading && (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={handleUpload}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'Image' : 'Images'}
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
      {previews.length > 0 && selectedFiles.length === 0 && !error && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">✓ {previews.length} image{previews.length > 1 ? 's' : ''} ready</p>
        </div>
      )}
    </div>
  );
};

export default MultiImageUpload;
