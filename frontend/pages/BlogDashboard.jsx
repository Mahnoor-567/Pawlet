import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ImageUpload from './ImageUpload';

const API_BASE = 'http://localhost:5000/api/blogs';

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  changes_requested: 'bg-orange-100 text-orange-800'
};

const formatStatus = (status) => {
  if (status === 'changes_requested') return 'Changes Requested';
  if (!status) return 'Pending';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const BlogDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const authToken = token || localStorage.getItem('authToken');

  const [activeTab, setActiveTab] = useState('my-blogs');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [formState, setFormState] = useState({
    title: '',
    content: '',
    tags: '',
    featuredImage: ''
  });

  const headers = {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  const fetchMyBlogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/mine`, { headers });
      const data = await response.json();
      if (data.success) {
        setBlogs(data.blogs || []);
      } else {
        setError(data.message || 'Failed to load your blogs');
      }
    } catch (err) {
      setError('Failed to load your blogs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    fetchMyBlogs();
  }, [authToken, navigate]);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const resetForm = () => {
    setFormState({ title: '', content: '', tags: '', featuredImage: '' });
    setEditingId(null);
    setEditingStatus(null);
  };

  const parseTags = (value) => value.split(',').map((tag) => tag.trim()).filter(Boolean);

  const saveBlog = async (status) => {
    resetMessages();

    const trimmedTitle = formState.title.trim();
    const trimmedContent = formState.content.trim();
    const tagsArray = parseTags(formState.tags);
    const images = formState.featuredImage ? [formState.featuredImage] : [];
    const isDraft = status === 'draft';

    if (!trimmedTitle) {
      setError('Title is required.');
      return;
    }

    if (!isDraft && (!trimmedContent || tagsArray.length === 0)) {
      setError('Content and at least one tag are required to submit for approval.');
      return;
    }

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          tags: tagsArray,
          images,
          status
        })
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(data.message || (isDraft ? 'Blog saved as draft.' : 'Blog submitted for admin approval.'));
        resetForm();
        setActiveTab('my-blogs');
        fetchMyBlogs();
      } else {
        setError(data.message || 'Failed to create blog');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleSaveDraft = (e) => {
    e.preventDefault();
    saveBlog('draft');
  };

  const handleSubmitForApproval = (e) => {
    e.preventDefault();
    saveBlog('pending');
  };

  const startEdit = (blog) => {
    resetMessages();
    setEditingId(blog._id);
    setEditingStatus(blog.status);
    setFormState({
      title: blog.title || '',
      content: blog.content || '',
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : '',
      featuredImage: Array.isArray(blog.images) && blog.images.length > 0 ? blog.images[0] : ''
    });
    setActiveTab('my-blogs');
  };

  const handleUpdate = async (blogId, submitStatus) => {
    resetMessages();

    const trimmedTitle = formState.title.trim();
    const trimmedContent = formState.content.trim();
    const tagsArray = parseTags(formState.tags);
    const images = formState.featuredImage ? [formState.featuredImage] : [];
    const isDraftSave = editingStatus === 'draft' && submitStatus !== 'pending';

    if (!trimmedTitle) {
      setError('Title is required.');
      return;
    }

    if (!isDraftSave && (!trimmedContent || tagsArray.length === 0)) {
      setError('Content and at least one tag are required to submit for approval.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/${blogId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          tags: tagsArray,
          images,
          status: submitStatus
        })
      });
      const data = await response.json();

      if (data.success && data.blog) {
        setBlogs((prev) => prev.map((b) => (b._id === blogId ? data.blog : b)));
        setSuccess(data.message || 'Blog updated successfully.');
        resetForm();
      } else {
        setError(data.message || 'Failed to update blog');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleDelete = async (blogId) => {
    resetMessages();
    if (!window.confirm('Are you sure you want to delete this blog?')) return;

    try {
      const response = await fetch(`${API_BASE}/${blogId}`, {
        method: 'DELETE',
        headers
      });
      const data = await response.json();

      if (data.success) {
        setBlogs((prev) => prev.filter((b) => b._id !== blogId));
        if (editingId === blogId) {
          resetForm();
        }
        setSuccess('Blog deleted permanently.');
      } else {
        setError(data.message || 'Failed to delete blog');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleView = (blog) => {
    if (blog.status === 'approved') {
      navigate(`/blogs/${blog._id}`);
      return;
    }
    navigate(`/writer/blogs/${blog._id}`);
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blog Writer Dashboard</h1>
          <p className="mt-2 text-gray-500">Create and manage your blog posts for Pawlet.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('my-blogs'); resetForm(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'my-blogs' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            My Blogs
          </button>
          <button
            onClick={() => { setActiveTab('write'); resetForm(); resetMessages(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'write' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
          >
            Write New Blog
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">{error}</div>}
        {success && <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">{success}</div>}

        {activeTab === 'write' && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Write New Blog</h2>
            <form onSubmit={handleSubmitForApproval} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter Blog Title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={formState.content}
                  onChange={(e) => setFormState((prev) => ({ ...prev, content: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Write your blog content..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formState.tags}
                  onChange={(e) => setFormState((prev) => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="dog care, training, nutrition"
                />
              </div>
              <div>
                <ImageUpload
                  label="Featured Image"
                  currentImage={formState.featuredImage}
                  onImageSelect={(imageData) => setFormState((prev) => ({ ...prev, featuredImage: imageData.url }))}
                  maxSize={5}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={handleSaveDraft} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold">
                  Save as Draft
                </button>
                <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold">
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'my-blogs' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Blogs ({blogs.length})</h2>

            {loading ? (
              <p className="text-gray-500 py-12 text-center">Loading your blogs...</p>
            ) : blogs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <p className="text-gray-600 mb-4">You have not created any blogs yet.</p>
                <button
                  onClick={() => setActiveTab('write')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  Write New Blog
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {blogs.map((blog) => (
                  <div key={blog._id} className="bg-white rounded-2xl shadow-md p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{blog.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[blog.status] || STATUS_STYLES.pending}`}>
                            {formatStatus(blog.status)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Created: {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : '—'}
                        </p>
                        {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {blog.tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">{tag}</span>
                            ))}
                          </div>
                        )}
                        {(blog.status === 'rejected' || blog.status === 'changes_requested') && blog.adminFeedback && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            <span className="font-semibold">Admin feedback: </span>{blog.adminFeedback}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => handleView(blog)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">View</button>
                        <button onClick={() => startEdit(blog)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Edit</button>
                        <button onClick={() => handleDelete(blog._id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">Delete</button>
                      </div>
                    </div>

                    {editingId === blog._id && (
                      <div className="mt-6 pt-6 border-t space-y-4">
                        <h4 className="font-semibold text-gray-900">Edit Blog</h4>
                        {editingStatus === 'approved' && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                            This blog is currently Approved. Saving changes will set status back to Pending for admin review.
                          </div>
                        )}
                        <input
                          type="text"
                          value={formState.title}
                          onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Title"
                        />
                        <textarea
                          value={formState.content}
                          onChange={(e) => setFormState((prev) => ({ ...prev, content: e.target.value }))}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Content"
                        />
                        <input
                          type="text"
                          value={formState.tags}
                          onChange={(e) => setFormState((prev) => ({ ...prev, tags: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="Tags (comma separated)"
                        />
                        <ImageUpload
                          label="Featured Image"
                          currentImage={formState.featuredImage}
                          onImageSelect={(imageData) => setFormState((prev) => ({ ...prev, featuredImage: imageData.url }))}
                          maxSize={5}
                        />
                        <div className="flex flex-wrap gap-2">
                          {editingStatus === 'draft' ? (
                            <>
                              <button onClick={() => handleUpdate(blog._id, 'draft')} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium">Save as Draft</button>
                              <button onClick={() => handleUpdate(blog._id, 'pending')} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium">Submit for Approval</button>
                            </>
                          ) : (
                            <button onClick={() => handleUpdate(blog._id)} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium">Save Changes</button>
                          )}
                          <button onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogDashboard;
