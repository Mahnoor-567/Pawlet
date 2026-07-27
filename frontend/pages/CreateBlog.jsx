import React, { useState } from 'react';
import axios from 'axios';

const CreateBlog = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const readImageAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });

  const buildPayload = async (status) => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const tagsArray = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    if (!trimmedTitle || !trimmedContent || tagsArray.length === 0) {
      throw new Error('Title, content, and tags are required.');
    }

    let images = [];
    if (imageFile) {
      const imageData = await readImageAsBase64(imageFile);
      images = [imageData];
    }

    return {
      title: trimmedTitle,
      content: trimmedContent,
      tags: tagsArray,
      images,
      status
    };
  };

  const handleSubmit = async (status) => {
    resetMessages();
    setLoading(true);

    try {
      const baseUrl = process.env.REACT_APP_API_URL || '';
      const payload = await buildPayload(status);
      await axios.post(`${baseUrl}/api/blogs`, payload);

      setSuccess(status === 'draft' ? 'Draft saved successfully.' : 'Blog submitted for approval.');
      setTitle('');
      setContent('');
      setTags('');
      setImageFile(null);
    } catch (submitError) {
      setError(submitError.message || 'Failed to submit blog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Blog</h1>
          <p className="mt-2 text-gray-500">Share your latest insights with the community.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-xl border border-orange-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Enter Blog Title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="mt-2 w-full min-h-[180px] rounded-xl border border-orange-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="Write your blog content..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                className="mt-2 w-full rounded-xl border border-orange-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="dog care, training, nutrition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Image Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                className="mt-2 w-full text-sm text-gray-500"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">
                {success}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSubmit('pending')}
                disabled={loading}
                className="px-6 py-2 rounded-full bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'Submit for Review'}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="px-6 py-2 rounded-full border border-orange-300 text-orange-500 font-semibold hover:bg-orange-50 transition-colors disabled:opacity-60"
              >
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBlog;
