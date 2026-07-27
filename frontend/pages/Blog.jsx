import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Blog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchBlogs = async () => {
      setLoading(true);
      setError('');

      try {
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${apiBaseUrl}/api/blogs`);
        const apiBlogs = Array.isArray(response.data?.blogs) ? response.data.blogs : [];

        if (isMounted) {
          setBlogs(apiBlogs);
        }
      } catch (fetchError) {
        console.error('Fetch blogs error:', fetchError);
        if (isMounted) {
          setError('Unable to load blogs right now. Please try again.');
          setBlogs([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBlogs();

    return () => {
      isMounted = false;
    };
  }, []);

  const getAuthorName = (blog) => {
    if (blog?.author && typeof blog.author === 'object') {
      return blog.author.name || blog.author.email || 'Unknown';
    }
    return blog?.author || 'Unknown';
  };

  const getPreview = (content) => {
    if (!content) return '';
    return content.length > 140 ? `${content.slice(0, 140)}...` : content;
  };

  const handleOpenBlog = (blog) => {
    const blogId = blog?._id || blog?.id;
    if (blogId) {
      navigate(`/blogs/${blogId}`);
    }
  };

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
          <p className="mt-2 text-gray-500 text-lg">Latest tips and insights from our writers</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">Loading</p>
            <p className="text-xl">Fetching blogs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">Error</p>
            <p className="text-xl">{error}</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">No blogs</p>
            <p className="text-xl">No blogs available currently</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <button
                key={blog._id || blog.id}
                type="button"
                onClick={() => handleOpenBlog(blog)}
                className="text-left bg-white rounded-2xl overflow-hidden shadow hover:shadow-lg transition-all hover:-translate-y-1"
              >
                {blog.image && (
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-800">{blog.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{getPreview(blog.content)}</p>
                  <div className="mt-4 text-xs text-gray-400">By {getAuthorName(blog)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Blog;
