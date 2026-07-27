import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cartApi } from '../services/shopApi';
import { formatPrice } from '../utils/formatPrice';

const API_BASE = 'http://localhost:5000/api/products';

const getStockQty = (stock) => Number(stock) || 0;

const getStockLabel = (stock) => {
  const qty = getStockQty(stock);
  return qty > 0 ? `In Stock (${qty} available)` : 'Out of Stock';
};

const Shop = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [cartCount, setCartCount] = useState(0);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    fetchCategories();
    if (isAuthenticated()) {
      loadCartCount();
    }
  }, [isAuthenticated]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (category && category !== 'all') params.set('category', category);
      if (sort) params.set('sort', sort);
      const query = params.toString();
      const response = await fetch(`${API_BASE}${query ? `?${query}` : ''}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Failed to fetch products');
        setProducts([]);
        return;
      }
      if (data.success) {
        setProducts(data.products || []);
      } else {
        setError(data.message || 'Failed to fetch products');
        setProducts([]);
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [search, category, sort]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/categories`);
      const data = await response.json();
      if (data.success) setCategories(data.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadCartCount = async () => {
    try {
      const data = await cartApi.get();
      setCartCount(data.cart?.items?.length || 0);
    } catch {
      setCartCount(0);
    }
  };

  const handleViewDetails = (product) => {
    navigate(`/products/${product._id}`);
  };

  const handleAddToCart = async (product, qty = 1) => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: '/shop' } });
      return;
    }
    if (getStockQty(product.stock) <= 0) {
      setError('This product is out of stock.');
      return;
    }

    setAddingId(product._id);
    setError('');
    setSuccess('');
    try {
      await cartApi.add(product._id, qty);
      setSuccess(`"${product.name}" added to cart!`);
      await loadCartCount();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-4">PawMart</h1>
          <p className="text-xl text-orange-100">Everything your furry friend needs in one place</p>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Our Products</h2>
            <p className="text-xl text-gray-600">Premium quality pet supplies</p>
          </div>
          <button
            onClick={() => isAuthenticated() ? navigate('/cart') : navigate('/login')}
            className="relative px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 shadow-lg flex items-center gap-2"
          >
            🛒 Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by name</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by price</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="newest">Newest first</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">{error}</div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">{success}</div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mx-auto"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-5xl mb-4">{search || category !== 'all' ? '🔍' : '📦'}</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {search || category !== 'all' ? 'No search results' : 'No products available'}
            </h3>
            <p className="text-gray-600">
              {search || category !== 'all'
                ? 'No products match your search or filters. Try different keywords or clear filters.'
                : 'Check back soon for new arrivals.'}
            </p>
            {(search || category !== 'all') && (
              <button
                type="button"
                onClick={() => { setSearch(''); setCategory('all'); setSort('newest'); }}
                className="mt-6 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                <div className="relative h-64 overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl">📦</div>
                  )}
                  <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {formatPrice(product.price, { decimals: false })}
                  </div>
                </div>
                <div className="p-6">
                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                    {product.category || 'Other'}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mt-2 mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                  <p className={`text-sm mb-4 ${getStockQty(product.stock) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {getStockLabel(product.stock)}
                  </p>
                  <button
                    onClick={() => handleViewDetails(product)}
                    className="w-full px-4 py-3 bg-gray-900 text-white font-semibold rounded-full hover:bg-gray-800 text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Shop;
