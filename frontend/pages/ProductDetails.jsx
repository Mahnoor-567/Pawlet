import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cartApi } from '../services/shopApi';
import { formatPrice } from '../utils/formatPrice';

const API_BASE = 'http://localhost:5000/api/products';

const getStockQty = (stock) => Number(stock) || 0;

const getStockLabel = (stock) => {
  const qty = getStockQty(stock);
  return qty > 0 ? `In Stock (${qty} available)` : 'Out of Stock';
};

const ProductDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/${id}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || 'Product not found');
        setProduct(null);
        return;
      }
      if (data.success && data.product) {
        setProduct(data.product);
      } else {
        setError(data.message || 'Product not found');
        setProduct(null);
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    if (!product || getStockQty(product.stock) <= 0) {
      setError('This product is out of stock.');
      return;
    }

    setAdding(true);
    setError('');
    setSuccess('');
    try {
      await cartApi.add(product._id, Math.min(quantity, getStockQty(product.stock)));
      setSuccess('Added to cart!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate('/shop')} className="px-6 py-2 bg-orange-500 text-white rounded-full">
            Back to PawMart
          </button>
        </div>
      </div>
    );
  }

  const shop = product.shop || product.shopId;
  const stockQty = getStockQty(product.stock);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center text-orange-500 hover:text-orange-600 font-semibold mb-8"
        >
          ← Back to PawMart
        </button>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">{success}</div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="relative h-80 md:h-auto min-h-[320px] bg-gray-100">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
              )}
            </div>

            <div className="p-8 md:p-10">
              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full mb-3">
                {product.category || 'Other'}
              </span>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-4xl font-bold text-orange-500 mb-4">{formatPrice(product.price, { decimals: false })}</p>
              <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>

              <p className={`text-sm font-medium mb-6 ${stockQty > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {getStockLabel(product.stock)}
              </p>

              {shop && (
                <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="text-sm text-gray-500">Sold by</p>
                  <p className="font-semibold text-gray-900">{shop.shopName || shop.name || 'Pawlet Seller'}</p>
                  {shop.shopDescription && (
                    <p className="text-sm text-gray-600 mt-1">{shop.shopDescription}</p>
                  )}
                </div>
              )}

              {stockQty > 0 && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 bg-gray-200 rounded-full hover:bg-gray-300"
                      >
                        −
                      </button>
                      <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.min(stockQty, quantity + 1))}
                        className="w-10 h-10 bg-gray-200 rounded-full hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={adding}
                    className="w-full px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-full hover:bg-orange-600 disabled:opacity-50 shadow-lg"
                  >
                    {adding ? 'Adding...' : 'Add to Cart'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;
