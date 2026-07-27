import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api/blogs';
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop';

const BlogDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const authToken = token || localStorage.getItem('authToken');

  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [commentError, setCommentError] = useState('');
  const [commentSuccess, setCommentSuccess] = useState('');

  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`${API_BASE}/${id}`);
        const data = await response.json();

        if (data.success) {
          setBlog(data.blog);
        } else {
          setError(data.message || 'Unable to load this blog right now.');
          setBlog(null);
        }
      } catch (fetchError) {
        setError('Unable to load this blog right now. Please try again.');
        setBlog(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBlog();
    } else {
      setLoading(false);
      setError('Missing blog ID.');
    }
  }, [id]);

  useEffect(() => {
    const fetchComments = async () => {
      if (!id) return;
      setCommentsLoading(true);

      try {
        const response = await fetch(`${API_BASE}/${id}/comments`);
        const data = await response.json();
        if (data.success) {
          setComments(data.comments || []);
        } else {
          setComments([]);
        }
      } catch {
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [id]);

  const getAuthorName = (author) => {
    if (author && typeof author === 'object') {
      return author.name || author.email || 'Unknown';
    }
    return author || 'Unknown';
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    setCommentError('');
    setCommentSuccess('');

    const trimmed = commentText.trim();
    if (!trimmed) {
      setCommentError('Comment cannot be empty.');
      return;
    }

    if (!isAuthenticated()) {
      setCommentError('Please log in to comment.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/${id}/comments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: trimmed })
      });
      const data = await response.json();

      if (data.success && data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setCommentText('');
        setCommentSuccess('Comment posted successfully.');
      } else {
        setCommentError(data.message || 'Failed to post comment.');
      }
    } catch {
      setCommentError('Unable to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTags = (tags) => {
    if (!Array.isArray(tags) || tags.length === 0) return null;

    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button onClick={() => navigate('/blogs')} className="text-orange-500 hover:underline mb-4">← Back to Blogs</button>

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">Fetching blog details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl text-red-600">{error}</p>
          </div>
        ) : blog ? (
          <>
            <div className="bg-white rounded-3xl shadow-lg p-6 sm:p-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{blog.title}</h1>
              <p className="mt-3 text-sm text-gray-400">
                By {getAuthorName(blog.author)}
                {blog.createdAt && ` · ${new Date(blog.createdAt).toLocaleDateString()}`}
              </p>
              {blog.images?.[0] && (
                <img
                  src={blog.images[0]}
                  alt={blog.title}
                  className="mt-6 w-full max-h-96 object-cover rounded-2xl"
                  onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                />
              )}
              {renderTags(blog.tags)}
              <div className="mt-6 text-gray-700 leading-relaxed whitespace-pre-line">
                {blog.content}
              </div>
            </div>

            <div className="mt-8 bg-white rounded-3xl shadow-lg p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Comments ({comments.length})</h2>

              {isAuthenticated() ? (
                <form onSubmit={handleAddComment} className="mb-8">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    placeholder="Write a comment..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                  {commentError && (
                    <p className="mt-2 text-sm text-red-600">{commentError}</p>
                  )}
                  {commentSuccess && (
                    <p className="mt-2 text-sm text-green-600">{commentSuccess}</p>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-3 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-semibold disabled:opacity-50"
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              ) : (
                <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-gray-700">
                  <Link to="/login" className="text-orange-600 font-semibold hover:underline">Log in</Link>
                  {' '}to leave a comment.
                </div>
              )}

              {commentsLoading ? (
                <p className="text-gray-500">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-gray-500">No comments yet. Be the first to comment!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment._id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                        <span className="font-semibold text-gray-800">{getAuthorName(comment.author)}</span>
                        <span>{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ''}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{comment.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">Blog details are unavailable.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogDetails;
