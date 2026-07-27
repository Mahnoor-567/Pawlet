import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cartApi, orderApi } from '../services/shopApi';
import { formatPrice } from '../utils/formatPrice';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, token, updateUser, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [dogs, setDogs] = useState([]);
  const [products, setProducts] = useState([]);
  const [myDogs, setMyDogs] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [warning, setWarning] = useState('');
  const [cart, setCart] = useState({ items: [], totalAmount: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchUserProfile();
    loadCartFromApi();
    loadOrdersFromApi();
    
    // Check for warning message from navigation state
    if (location.state?.warning) {
      setWarning(location.state.warning);
      // Clear the warning after 5 seconds
      setTimeout(() => setWarning(''), 5000);
      // Clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, []);

  // Refresh cart when cart section is active
  useEffect(() => {
    if (activeSection === 'cart') {
      loadCartFromApi();
      loadOrdersFromApi();
    }
  }, [activeSection]);

  const loadCartFromApi = async () => {
    if (!token) return;
    try {
      const data = await cartApi.get();
      setCart(data.cart || { items: [], totalAmount: 0 });
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const loadOrdersFromApi = async () => {
    if (!token) return;
    try {
      const data = await orderApi.getMyOrders();
      setRecentOrders(data.orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const fetchUserProfile = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user || data;
        setProfileData(userData);
        if (data.user) {
          updateUser(data.user);
        }
      } else {
        if (response.status === 401) {
          logout();
          navigate('/login');
        } else {
          setError('Failed to fetch profile data');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Menu items for Registered Users
  const userMenuItems = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'available-dogs', name: 'Available Dogs', icon: '🐕' },
    { id: 'care-tips', name: 'Dog Care Tips', icon: '💡' },
    { id: 'shop-products', name: 'PawMart Products', icon: '🛍️' },
    { id: 'cart', name: 'Cart & Orders', icon: '🛒' },
    { id: 'profile', name: 'My Profile', icon: '👤' }
  ];

  // Menu items for Sellers
  const sellerMenuItems = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'manage-dogs', name: 'Manage Dog Listings', icon: '🐕' },
    { id: 'manage-products', name: 'Manage Products', icon: '📦' },
    { id: 'orders', name: 'View Orders', icon: '📋' },
    { id: 'blogs', name: 'Manage Blogs', icon: '✍️' },
    { id: 'profile', name: 'My Profile', icon: '👤' }
  ];

  const getMenuItems = () => {
    const role = profileData?.role || authUser?.role;
    return role === 'seller' ? sellerMenuItems : userMenuItems;
  };

  const renderOverviewSection = () => {
    const role = profileData?.role || authUser?.role;
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {role === 'seller' ? (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Dog Listings</p>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                  </div>
                  <div className="text-4xl">🐕</div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Products Listed</p>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                  </div>
                  <div className="text-4xl">📦</div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                  </div>
                  <div className="text-4xl">📋</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Available Dogs</p>
                    <p className="text-3xl font-bold text-gray-900">0</p>
                  </div>
                  <div className="text-4xl">🐕</div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Cart Items</p>
                    <p className="text-3xl font-bold text-gray-900">{cart.items?.length || 0}</p>
                  </div>
                  <div className="text-4xl">🛒</div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">My Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{recentOrders.length}</p>
                  </div>
                  <div className="text-4xl">📦</div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-2">Welcome, {profileData?.name || authUser?.name || 'User'}!</h3>
          <p className="text-indigo-100">Role: <span className="font-semibold">{role === 'seller' ? 'Seller' : 'Registered User'}</span></p>
          <p className="text-indigo-100 mt-2">Email: {profileData?.email || authUser?.email}</p>
        </div>
      </div>
    );
  };

  const fetchAvailableDogs = async () => {
    setSectionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/dogs');
      if (response.ok) {
        const data = await response.json();
        setDogs(data.listings || data.dogs || []);
      }
    } catch (err) {
      console.error('Error fetching dogs:', err);
    } finally {
      setSectionLoading(false);
    }
  };

  const renderAvailableDogsSection = () => {
    if (!dogs.length && activeSection === 'available-dogs' && !sectionLoading) {
      fetchAvailableDogs();
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Available Dogs</h2>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            View All in Marketplace
          </button>
        </div>

        {sectionLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : dogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dogs.slice(0, 6).map((dog) => (
              <div key={dog._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/dogs/${dog._id}`)}>
                <div className="h-48 bg-gray-200 overflow-hidden">
                  {dog.images && dog.images[0] ? (
                    <img src={dog.images[0]} alt={dog.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">🐕</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{dog.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Breed:</span> {dog.breed}</p>
                    <p><span className="font-medium">Age:</span> {dog.age} {dog.age === 1 ? 'year' : 'years'}</p>
                    <p><span className="font-medium">Price:</span> {formatPrice(dog.price, { decimals: false })}</p>
                    <p><span className="font-medium">Location:</span> {dog.location}</p>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      dog.healthStatus === 'Healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {dog.healthStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-6xl mb-4">🐕</div>
            <p className="text-gray-600">No dogs available at the moment</p>
          </div>
        )}
      </div>
    );
  };

  const renderCareTipsSection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dog Care Tips</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-indigo-600">🍖 Nutrition</h3>
          <p className="text-gray-600">Provide balanced diet with quality dog food. Always ensure fresh water is available.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-indigo-600">🏃 Exercise</h3>
          <p className="text-gray-600">Regular walks and playtime are essential for your dog's physical and mental health.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-indigo-600">💉 Health</h3>
          <p className="text-gray-600">Keep vaccinations up to date and schedule regular vet check-ups.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-indigo-600">🧼 Grooming</h3>
          <p className="text-gray-600">Regular brushing, nail trimming, and bathing keep your dog healthy and happy.</p>
        </div>
      </div>
    </div>
  );

  const fetchProducts = async () => {
    setSectionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setSectionLoading(false);
    }
  };

  const renderShopProductsSection = () => {
    if (!products.length && activeSection === 'shop-products' && !sectionLoading) {
      fetchProducts();
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">PawMart Products</h2>

        {sectionLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gray-200 overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-indigo-600">{formatPrice(product.price, { decimals: false })}</span>
                    <button
                      onClick={async () => {
                        try {
                          await cartApi.add(product._id, 1);
                          await loadCartFromApi();
                        } catch (err) {
                          alert(err.message);
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-6xl mb-4">🛍️</div>
            <p className="text-gray-600 mb-4">Browse dog food, toys, accessories, and more</p>
            <p className="text-sm text-gray-500">No products available at the moment</p>
          </div>
        )}
      </div>
    );
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      const data = await cartApi.remove(productId);
      setCart(data.cart || { items: [], totalAmount: 0 });
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const data = await cartApi.update(productId, newQuantity);
      setCart(data.cart);
    } catch (error) {
      console.error('Error updating cart:', error);
    }
  };

  const calculateTotal = () => {
    return (cart.totalAmount || 0).toFixed(2);
  };

  const renderCartSection = () => {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Cart & Orders</h2>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Shopping Cart</h3>
            {cart.items?.length > 0 && (
              <span className="text-sm text-gray-600">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          {cart.items?.length > 0 ? (
            <>
              <div className="space-y-4">
                {cart.items.map((item) => {
                  const productId = item.productId || item.product?._id;
                  return (
                  <div key={productId} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-16 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {(item.image || item.product?.image) ? (
                          <img src={item.image || item.product?.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">📦</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.name || item.product?.name}</h4>
                        <p className="text-sm text-gray-600">{formatPrice(item.price, { decimals: false })}</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <label className="text-sm text-gray-600">Qty:</label>
                          <button
                            onClick={() => handleUpdateQuantity(productId, item.quantity - 1)}
                            className="px-2 py-1 border rounded hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="px-3">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(productId, item.quantity + 1)}
                            className="px-2 py-1 border rounded hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveFromCart(productId)}
                      className="ml-4 text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  );
                })}
              </div>
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-indigo-600">{formatPrice(calculateTotal())}</span>
                </div>
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-600 mb-4">Your cart is empty</p>
              <button
                onClick={() => navigate('/shop')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Recent Orders</h3>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">Order #{order._id?.slice(-8)}</p>
                      <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="border-t pt-3 mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{item.name} x {item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-indigo-600">{formatPrice(order.totalAmount)}</span>
                  </div>
                  {order.deliveryAddress && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">Delivered to: {order.deliveryAddress.name}</p>
                      <p className="text-xs text-gray-500">{order.deliveryAddress.address}, {order.deliveryAddress.city}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 mb-4">No orders yet</p>
              <button
                onClick={() => navigate('/shop')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Start Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const fetchMyDogs = async () => {
    setSectionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/dogs/mine', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMyDogs(data.listings || data.dogs || []);
      }
    } catch (err) {
      console.error('Error fetching my dogs:', err);
    } finally {
      setSectionLoading(false);
    }
  };

  const handleDeleteDog = async (dogId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/dogs/${dogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setMyDogs(myDogs.filter(dog => dog._id !== dogId));
      }
    } catch (err) {
      console.error('Error deleting dog:', err);
    }
  };

  const handleMarkAsSold = async (dogId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/dogs/${dogId}/sold`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        fetchMyDogs();
      }
    } catch (err) {
      console.error('Error marking as sold:', err);
    }
  };

  const renderManageDogsSection = () => {
    if (!myDogs.length && activeSection === 'manage-dogs' && !sectionLoading) {
      fetchMyDogs();
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Manage Dog Listings</h2>
          <button
            onClick={() => navigate('/seller-dashboard')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add New Dog
          </button>
        </div>

        {sectionLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : myDogs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {myDogs.map((dog) => (
              <div key={dog._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-48 h-48 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {dog.images && dog.images[0] ? (
                      <img src={dog.images[0]} alt={dog.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">🐕</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{dog.name}</h3>
                        <p className="text-sm text-gray-600">{dog.breed} • {dog.age} years old</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        dog.status === 'Sold' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {dog.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Price</p>
                        <p className="font-semibold">{formatPrice(dog.price, { decimals: false })}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-semibold">{dog.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Health Status</p>
                        <p className="font-semibold">{dog.healthStatus}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate('/seller-dashboard')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                      >
                        Edit
                      </button>
                      {dog.status !== 'Sold' && dog.approvalStatus === 'approved' && (
                        <button
                          onClick={() => handleMarkAsSold(dog._id)}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          Mark as Sold
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteDog(dog._id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-6xl mb-4">🐕</div>
            <p className="text-gray-600 mb-4">You haven't created any dog listings yet</p>
            <button
              onClick={() => navigate('/seller-dashboard')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Your First Listing
            </button>
          </div>
        )}
      </div>
    );
  };

  const fetchMyProducts = async () => {
    setSectionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/products/mine', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMyProducts(data.products || []);
      }
    } catch (err) {
      console.error('Error fetching my products:', err);
    } finally {
      setSectionLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setMyProducts(myProducts.filter(product => product._id !== productId));
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const renderManageProductsSection = () => {
    if (!myProducts.length && activeSection === 'manage-products' && !sectionLoading) {
      fetchMyProducts();
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Manage PawMart Products</h2>
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Add New Product
          </button>
        </div>

        {sectionLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : myProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProducts.map((product) => (
              <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-48 bg-gray-200">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                  <p className="text-xl font-bold text-indigo-600 mb-4">{formatPrice(product.price, { decimals: false })}</p>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors text-sm">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600 mb-4">You haven't listed any products yet</p>
            <p className="text-sm text-gray-500">Start selling dog food, toys, and accessories</p>
          </div>
        )}
      </div>
    );
  };

  const fetchOrders = async () => {
    setSectionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/orders/my-orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setSectionLoading(false);
    }
  };

  const renderOrdersSection = () => {
    if (!orders.length && activeSection === 'orders' && !sectionLoading) {
      fetchOrders();
    }

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">View Orders</h2>

        {sectionLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : orders.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order._id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.deliveryAddress?.name || 'Customer'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {order.items?.map((i) => i.name).join(', ') || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {formatPrice(order.totalAmount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                          order.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.orderStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.orderStatus || 'pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-600 mb-2">No orders received yet</p>
            <p className="text-sm text-gray-500">Orders from customers will appear here</p>
          </div>
        )}
      </div>
    );
  };

  const fetchBlogs = async () => {
    setSectionLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/blogs/mine', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBlogs(data.blogs || []);
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setSectionLoading(false);
    }
  };

  const handleDeleteBlog = async (blogId) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/blogs/${blogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        setBlogs(blogs.filter(blog => blog._id !== blogId));
      }
    } catch (err) {
      console.error('Error deleting blog:', err);
    }
  };

  const renderBlogsSection = () => {
    if (!blogs.length && activeSection === 'blogs' && !sectionLoading) {
      fetchBlogs();
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Manage Blogs</h2>
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Create New Post
          </button>
        </div>

        {sectionLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : blogs.length > 0 ? (
          <div className="space-y-4">
            {blogs.map((blog) => (
              <div key={blog._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{blog.title}</h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">{blog.content || blog.excerpt}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📅 {new Date(blog.createdAt).toLocaleDateString()}</span>
                      {blog.category && <span>🏷️ {blog.category}</span>}
                      <span className={`px-2 py-1 rounded text-xs ${
                        blog.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {blog.published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBlog(blog._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="text-6xl mb-4">✍️</div>
            <p className="text-gray-600 mb-4">You haven't created any blog posts yet</p>
            <p className="text-sm text-gray-500">Share your knowledge and experiences with dog care</p>
          </div>
        )}
      </div>
    );
  };

  const renderProfileSection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-white">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-indigo-600 text-3xl font-bold">
              {(profileData?.name || authUser?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="ml-6">
              <h3 className="text-2xl font-bold">{profileData?.name || authUser?.name || 'User'}</h3>
              <p className="text-indigo-100">{profileData?.email || authUser?.email}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
            <p className="text-lg text-gray-900">{profileData?.name || authUser?.name || 'Not set'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email Address</label>
            <p className="text-lg text-gray-900">{profileData?.email || authUser?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {profileData?.role === 'seller' ? 'Seller' : 'Registered User'}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
            <p className="text-lg text-gray-900">{profileData?.phone || 'Not set'}</p>
          </div>

          {profileData?.role === 'seller' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">PawMart Name</label>
                <p className="text-lg text-gray-900">{profileData?.shopName || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">PawMart Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  profileData?.shopStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {profileData?.shopStatus || 'inactive'}
                </span>
              </div>
            </>
          )}

          <div className="pt-4">
            <button
              onClick={() => navigate('/profile')}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    const role = profileData?.role || authUser?.role;
    
    if (role === 'admin') {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">Admin features are not available in this dashboard.</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview': return renderOverviewSection();
      case 'available-dogs': return renderAvailableDogsSection();
      case 'care-tips': return renderCareTipsSection();
      case 'shop-products': return renderShopProductsSection();
      case 'cart': return renderCartSection();
      case 'manage-dogs': return renderManageDogsSection();
      case 'manage-products': return renderManageProductsSection();
      case 'orders': return renderOrdersSection();
      case 'blogs': return renderBlogsSection();
      case 'profile': return renderProfileSection();
      default: return renderOverviewSection();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md p-4 sticky top-4">
              <div className="mb-6 pb-4 border-b">
                <h2 className="text-lg font-bold text-gray-900">Dashboard</h2>
                <p className="text-sm text-gray-600">
                  {(profileData?.role || authUser?.role) === 'seller' ? 'Seller' : 'User'} Portal
                </p>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                      activeSection === item.id
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl mr-3">{item.icon}</span>
                    <span className="font-medium text-sm">{item.name}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Warning Message Banner */}
            {warning && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-yellow-800 flex-1">{warning}</p>
                  <button 
                    onClick={() => setWarning('')}
                    className="ml-4 text-yellow-600 hover:text-yellow-800 font-bold text-xl leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
