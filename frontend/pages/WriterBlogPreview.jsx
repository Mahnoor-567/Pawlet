import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api/blogs';

const WriterBlogPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const authToken = token || localStorage.getItem('authToken');

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await fetch(`${API_BASE}/writer/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await response.json();
        if (data.success) {
          setBlog(data.blog);
        } else {
          setError(data.message || 'Failed to load blog');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (!authToken) {
      navigate('/login');
      return;
    }
    fetchBlog();
  }, [id, authToken, navigate]);

  const formatStatus = (status) => {
    if (status === 'changes_requested') return 'Changes Requested';
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return <div className="min-h-screen bg-orange-50 flex items-center justify-center text-gray-500">Loading...</div>;
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Blog not found'}</p>
          <button onClick={() => navigate('/writer-dashboard')} className="text-orange-500 hover:underline">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <button onClick={() => navigate('/writer-dashboard')} className="text-orange-500 hover:underline mb-4">← Back to Dashboard</button>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">{formatStatus(blog.status)}</span>
            <span className="text-sm text-gray-500">Writer Preview — not public until approved</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{blog.title}</h1>
          {blog.images?.[0] && (
            <img src={blog.images[0]} alt={blog.title} className="mt-6 w-full max-h-96 object-cover rounded-xl" />
          )}
          {blog.tags?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">{tag}</span>
              ))}
            </div>
          )}
          <div className="mt-6 text-gray-700 whitespace-pre-line leading-relaxed">{blog.content}</div>
        </div>
      </div>
    </div>
  );
};

export default WriterBlogPreview;
