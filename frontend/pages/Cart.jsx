import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cartApi } from '../services/shopApi';
import { formatPrice } from '../utils/formatPrice';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: '/cart' } });
      return;
    }
    loadCart();
  }, [isAuthenticated, navigate]);

  const loadCart = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await cartApi.get();
      setCart(data.cart || { items: [], totalAmount: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId, newQty) => {
    if (newQty < 1) return;
    setUpdating(productId);
    setError('');
    try {
      const data = await cartApi.update(productId, newQty);
      setCart(data.cart);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleRemove = async (productId) => {
    setUpdating(productId);
    setError('');
    try {
      const data = await cartApi.remove(productId);
      setCart(data.cart);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center text-orange-500 hover:text-orange-600 font-semibold mb-8"
        >
          ← Continue Shopping
        </button>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">{error}</div>
        )}

        {cart.items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-xl text-gray-600 mb-6">Your cart is empty</p>
            <button
              onClick={() => navigate('/shop')}
              className="px-8 py-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 font-semibold"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => {
                const productId = item.productId || item.product?._id;
                return (
                  <div key={productId} className="bg-white rounded-2xl shadow-md p-6 flex gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.image || item.product?.image ? (
                        <img src={item.image || item.product?.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{item.name || item.product?.name}</h3>
                      <p className="text-orange-500 font-semibold mt-1">{formatPrice(item.price, { decimals: false })}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => handleUpdateQuantity(productId, item.quantity - 1)}
                          disabled={item.quantity <= 1 || updating === productId}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                        >
                          −
                        </button>
                        <span className="font-semibold w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(productId, item.quantity + 1)}
                          disabled={updating === productId}
                          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleRemove(productId)}
                          disabled={updating === productId}
                          className="ml-auto text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right font-bold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Items ({cart.items.length})</span>
                  <span>{formatPrice(cart.totalAmount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-2xl font-bold text-orange-500">{formatPrice(cart.totalAmount)}</span>
                </div>
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full mt-6 px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-full hover:bg-orange-600 shadow-lg"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
