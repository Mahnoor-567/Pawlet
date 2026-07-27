import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Forum = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newTags, setNewTags] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const tabs = ['All', 'Health', 'Training', 'Nutrition', 'Behavior', 'General'];

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { token } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${apiBaseUrl}/api/forum/posts`);
      const apiPosts = Array.isArray(response.data?.posts) ? response.data.posts : [];
      setPosts(apiPosts);
    } catch (fetchError) {
      console.error('Fetch forum posts error:', fetchError);
      setError('Unable to load forum posts right now. Please try again.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    let isMounted = true;
    const runFetch = async () => {
      if (!isMounted) return;
      await fetchPosts();
    };

    runFetch();

    return () => {
      isMounted = false;
    };
  }, [fetchPosts]);

  const filtered = posts.filter((post) => {
    const matchTab = activeTab === 'All' || post.category === activeTab;
    const matchSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchTab && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

  const handleSubmit = async () => {
    if (!newTitle.trim()) {
      setError('Title is required.');
      return;
    }
    if (!newBody.trim()) {
      setError('Content is required.');
      return;
    }

    if (!token) {
      setError('You must be logged in to create a post. Please login first.');
      setShowNewPost(false);
      return;
    }

    const tags = newTags.split(',').map((tag) => tag.trim()).filter(Boolean);

    try {
      setSuccessMessage('');
      setError('');
      const response = await axios.post(
        `${apiBaseUrl}/api/forum/posts`,
        {
          title: newTitle.trim(),
          content: newBody.trim(),
          category: newCategory,
          tags
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const created = response.data?.post;
      if (created) {
        await fetchPosts();
        setSuccessMessage(response.data?.message || 'Forum post created successfully');
      }

      setNewTitle('');
      setNewBody('');
      setNewTags('');
      setShowNewPost(false);
    } catch (submitError) {
      console.error('Create forum post error:', submitError);
      const msg = submitError.response?.data?.message || 'Unable to create a post right now. Please try again.';
      setError(msg);
    }
  };

  const categoryColors = {
    Health: 'bg-red-100 text-red-600',
    Training: 'bg-blue-100 text-blue-600',
    Nutrition: 'bg-green-100 text-green-600',
    Behavior: 'bg-yellow-100 text-yellow-700',
    General: 'bg-gray-100 text-gray-600',
  };

  const avatarColors = ['bg-orange-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400'];

  const getAuthorName = (post) => {
    if (post?.author && typeof post.author === 'object') {
      return post.author.name || post.author.email || 'Unknown';
    }
    return post?.author || 'Unknown';
  };

  const getAuthorInitials = (post) => {
    const name = getAuthorName(post);
    if (!name) return 'NA';
    const parts = name.trim().split(' ').filter((part) => part);
    if (parts.length === 0) return 'NA';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  const getPostDate = (post) => {
    if (!post?.createdAt) return '';
    return new Date(post.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PAWLET Forum</h1>
              <p className="text-gray-500 mt-1">Community discussions, Q and A, and expert advice</p>
            </div>
            <button
              onClick={() => setShowNewPost(true)}
              className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors shadow"
            >
              New Post
            </button>
          </div>
          {successMessage && (
            <div className="mt-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-100">
              {successMessage}
            </div>
          )}
          <div className="mt-5">
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full px-5 py-3 rounded-full border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab
                    ? 'bg-orange-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">Loading</p>
            <p className="text-xl">Fetching forum posts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">Error</p>
            <p className="text-xl">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">No posts</p>
            <p className="text-xl">No discussions yet.</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">No posts</p>
            <p className="text-xl">No discussions match your search.</p>
          </div>
        ) : (
          sorted.map((post, index) => (
            <div
              key={post._id || post.id || index}
              className={`bg-white rounded-2xl p-5 shadow hover:shadow-md transition-all cursor-pointer ${
                post.isPinned ? 'border-l-4 border-orange-400' : ''
              }`}
              onClick={() => post._id && navigate(`/forum/${post._id}`)}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                    avatarColors[index % avatarColors.length]
                  }`}
                >
                  {getAuthorInitials(post)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {post.isPinned && (
                      <span className="text-xs bg-orange-100 text-orange-500 px-2 py-0.5 rounded-full font-semibold">
                        Pinned
                      </span>
                    )}
                    {post.expertVerified && (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">
                        Expert Verified
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        categoryColors[post.category]
                      }`}
                    >
                      {post.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-base hover:text-orange-500 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{post.content}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                    <span>By {getAuthorName(post)}</span>
                    <span>{getPostDate(post)}</span>
                    <span>{post.replyCount || 0} replies</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (post._id) navigate(`/forum/${post._id}`);
                  }}
                  className="hidden sm:block px-4 py-2 text-sm border border-orange-300 text-orange-500 rounded-full hover:bg-orange-500 hover:text-white transition-colors flex-shrink-0"
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showNewPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create a New Post</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter Post Title"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <select
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                {tabs
                  .filter((tab) => tab !== 'All')
                  .map((tab) => (
                    <option key={tab}>{tab}</option>
                  ))}
              </select>
              <textarea
                placeholder="Enter Description"
                value={newBody}
                onChange={(event) => setNewBody(event.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
              <input
                type="text"
                placeholder="Enter Tags (optional, comma separated)"
                value={newTags}
                onChange={(event) => setNewTags(event.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setShowNewPost(false)}
                className="px-5 py-2 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 font-semibold"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forum;
