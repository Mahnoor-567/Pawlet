import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ExpertVerifiedBadge = () => (
  <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">
    Expert Verified
  </span>
);

const ForumDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [replyError, setReplyError] = useState('');
  const [editError, setEditError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const currentUserId = user?.id || user?._id;

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      setError('');

      try {
        const response = await axios.get(`${apiBaseUrl}/api/forum/posts/${id}`);
        if (response.data?.success) {
          setPost(response.data.post);
          setReplies(Array.isArray(response.data.replies) ? response.data.replies : []);
        } else {
          setError(response.data?.message || 'Unable to load this discussion.');
          setPost(null);
        }
      } catch (fetchError) {
        const msg = fetchError.response?.data?.message || 'Unable to load this discussion. Please try again.';
        setError(msg);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [apiBaseUrl, id]);

  const getAuthorName = (author) => {
    if (author && typeof author === 'object') {
      return author.name || author.email || 'Unknown';
    }
    return author || 'Unknown';
  };

  const getAuthorId = (author) => {
    if (!author) return null;
    if (typeof author === 'object' && author._id) return String(author._id);
    if (typeof author === 'object' && author.id) return String(author.id);
    return String(author);
  };

  const getDate = (dateValue) => {
    if (!dateValue) return '';
    return new Date(dateValue).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const hasExpertReply = replies.some((reply) => reply.isExpertAnswer);

  const handleReply = async (e) => {
    e.preventDefault();
    setReplyError('');
    setSuccessMessage('');

    const trimmed = replyText.trim();
    if (!trimmed) {
      setReplyError('Reply cannot be empty.');
      return;
    }

    if (!isAuthenticated()) {
      setReplyError('You must be logged in to reply.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        `${apiBaseUrl}/api/forum/posts/${id}/replies`,
        { content: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success && response.data.reply) {
        setReplies((prev) => [...prev, response.data.reply]);
        setReplyText('');
        setSuccessMessage(response.data.message || 'Reply added successfully');
      } else {
        setReplyError(response.data?.message || 'Failed to post reply.');
      }
    } catch (submitError) {
      const msg = submitError.response?.data?.message || 'Unable to post reply. Please try again.';
      setReplyError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (reply) => {
    setEditingReplyId(reply._id);
    setEditText(reply.content);
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingReplyId(null);
    setEditText('');
    setEditError('');
  };

  const handleEditReply = async (replyId) => {
    setEditError('');

    const trimmed = editText.trim();
    if (!trimmed) {
      setEditError('Reply cannot be empty.');
      return;
    }

    setEditSubmitting(true);
    try {
      const response = await axios.put(
        `${apiBaseUrl}/api/forum/posts/${id}/replies/${replyId}`,
        { content: trimmed },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.success && response.data.reply) {
        setReplies((prev) =>
          prev.map((reply) => (reply._id === replyId ? response.data.reply : reply))
        );
        cancelEdit();
      } else {
        setEditError(response.data?.message || 'Failed to update reply.');
      }
    } catch (submitError) {
      const msg = submitError.response?.data?.message || 'Unable to update reply. Please try again.';
      setEditError(msg);
    } finally {
      setEditSubmitting(false);
    }
  };

  const canEditReply = (reply) =>
    user?.role === 'expert' && currentUserId && getAuthorId(reply.author) === String(currentUserId);

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <button onClick={() => navigate('/forum')} className="text-orange-500 hover:underline mb-4">
          ← Back to Forum
        </button>

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">Loading discussion...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-xl text-red-600">{error}</p>
          </div>
        ) : post ? (
          <>
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {hasExpertReply && <ExpertVerifiedBadge />}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{post.title}</h1>
              <p className="mt-3 text-sm text-gray-400">
                By {getAuthorName(post.author)}
                {post.createdAt && ` · ${getDate(post.createdAt)}`}
              </p>
              {Array.isArray(post.tags) && post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-6 text-gray-700 leading-relaxed whitespace-pre-line">
                {post.content}
              </div>
            </div>

            <div className="mt-8 bg-white rounded-2xl p-6 sm:p-8 shadow">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Replies ({replies.length})
              </h2>

              {isAuthenticated() ? (
                <form onSubmit={handleReply} className="mb-8">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    placeholder="Write a reply..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  />
                  {replyError && <p className="mt-2 text-sm text-red-600">{replyError}</p>}
                  {successMessage && <p className="mt-2 text-sm text-green-600">{successMessage}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-3 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 font-semibold disabled:opacity-50"
                  >
                    {submitting ? 'Posting...' : 'Post Reply'}
                  </button>
                </form>
              ) : (
                <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-gray-700">
                  <Link to="/login" className="text-orange-600 font-semibold hover:underline">Log in</Link>
                  {' '}to reply to this discussion.
                </div>
              )}

              {replies.length === 0 ? (
                <p className="text-gray-500">No replies yet.</p>
              ) : (
                <div className="space-y-4">
                  {replies.map((reply) => (
                    <div key={reply._id} className="border border-gray-100 rounded-xl p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500 mb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-800">{getAuthorName(reply.author)}</span>
                          {reply.isExpertAnswer && <ExpertVerifiedBadge />}
                        </div>
                        <div className="flex items-center gap-3">
                          <span>{reply.createdAt ? new Date(reply.createdAt).toLocaleString() : ''}</span>
                          {canEditReply(reply) && editingReplyId !== reply._id && (
                            <button
                              type="button"
                              onClick={() => startEdit(reply)}
                              className="text-orange-500 hover:text-orange-600 font-medium"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>

                      {editingReplyId === reply._id ? (
                        <div>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                          />
                          {editError && <p className="mt-2 text-sm text-red-600">{editError}</p>}
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditReply(reply._id)}
                              disabled={editSubmitting}
                              className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 text-sm font-semibold disabled:opacity-50"
                            >
                              {editSubmitting ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 whitespace-pre-line">{reply.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">Discussion unavailable.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumDetail;
