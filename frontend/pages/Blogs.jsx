import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api/blogs';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop';

const Blogs = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(API_BASE);
        const data = await response.json();
        if (data.success) {
          setBlogs(data.blogs || []);
        } else {
          setError(data.message || 'Unable to load blogs');
          setBlogs([]);
        }
      } catch (err) {
        setError('Unable to load blogs right now. Please try again.');
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const getSummary = (content) => {
    if (!content) return '';
    return content.length > 140 ? `${content.slice(0, 140)}...` : content;
  };

  const getFeaturedImage = (blog) => {
    if (Array.isArray(blog.images) && blog.images.length > 0) return blog.images[0];
    return PLACEHOLDER_IMAGE;
  };

  const getAuthorName = (blog) => {
    if (blog?.author && typeof blog.author === 'object') {
      return blog.author.name || blog.author.email || 'Unknown';
    }
    return 'Unknown';
  };

  const filtered = blogs.filter((blog) => {
    const term = searchTerm.toLowerCase();
    const inTitle = blog.title?.toLowerCase().includes(term);
    const inContent = blog.content?.toLowerCase().includes(term);
    const inTags = Array.isArray(blog.tags) && blog.tags.some((tag) => tag.toLowerCase().includes(term));
    return inTitle || inContent || inTags;
  });

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="bg-white border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">PAWLET Blog</h1>
            <p className="mt-2 text-gray-500 text-lg">Expert tips on dog care, health, training, and more</p>
          </div>
          <div className="mt-6 max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-3 rounded-full border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-orange-50 text-gray-700"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">Fetching the latest articles...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600">
            <p className="text-xl">{error}</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">No blogs available currently.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl">No articles match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((blog) => (
              <div
                key={blog._id}
                className="bg-white rounded-2xl overflow-hidden shadow hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                onClick={() => navigate(`/blogs/${blog._id}`)}
              >
                <img
                  src={getFeaturedImage(blog)}
                  alt={blog.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                />
                <div className="p-5">
                  {Array.isArray(blog.tags) && blog.tags[0] && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
                      {blog.tags[0]}
                    </span>
                  )}
                  <h3 className="mt-3 font-bold text-gray-800 text-lg leading-snug hover:text-orange-500">
                    {blog.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">{getSummary(blog.content)}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                    <span>By {getAuthorName(blog)}</span>
                    <span>{blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(`/blogs/${blog._id}`); }}
                    className="mt-4 w-full py-2 border border-orange-400 text-orange-500 rounded-full text-sm font-medium hover:bg-orange-500 hover:text-white transition-colors"
                  >
                    Read More
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blogs;
