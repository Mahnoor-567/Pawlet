import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';
import ImageUpload from './ImageUpload';
import MultiImageUpload from './MultiImageUpload';
import { sellerShopApi } from '../services/shopApi';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, updateUser } = useAuth();
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const listingsRef = useRef(null);
  const [myShop, setMyShop] = useState(null);
  const productSectionRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Other',
    image: ''
  });
  const [productCategories] = useState(['Food', 'Toys', 'Accessories', 'Grooming', 'Health', 'Beds', 'Other']);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState('');
  const [productSuccess, setProductSuccess] = useState('');
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDogId, setEditingDogId] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    gender: 'Male',
    age: '',
    price: '',
    location: '',
    contactPhone: '',
    healthStatus: 'Healthy',
    images: [],
    description: ''
  });
  const [imageUploadError, setImageUploadError] = useState('');
  const [previewListing, setPreviewListing] = useState(null);
  const [showIndividualConfirmation, setShowIndividualConfirmation] = useState(false);
  const [shopChecked, setShopChecked] = useState(false);

  const token = localStorage.getItem('authToken');
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      return null;
    }
  })();
  const [currentShopStatus, setCurrentShopStatus] = useState('inactive');
  const [currentShopName, setCurrentShopName] = useState('');

  const shopStatus = (myShop?.status === 'approved' ? 'active' : myShop?.status || authUser?.shopStatus || storedUser?.shopStatus || currentShopStatus || 'inactive').toLowerCase();
  const shopName = myShop?.shopName || authUser?.shopName || storedUser?.shopName || currentShopName || '';
  const sellerType = authUser?.sellerType || storedUser?.sellerType || 'business';
  const isIndividualSeller = sellerType === 'individual';
  const isVerified = authUser?.isVerified ?? storedUser?.isVerified ?? true;
  const canUploadDogs = isIndividualSeller ? isVerified : (shopStatus === 'active' && isVerified);
  const isOnboardingPhase = !isIndividualSeller && !myShop;
  const hasIndividualListing = isIndividualSeller && dogs.length > 0;

  const handleSetSellerType = async (type) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/set-seller-type', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sellerType: type })
      });
      const data = await response.json();
      if (response.ok && data.user) {
        const existing = (() => {
          try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
        })();
        const updatedUser = { ...existing, ...data.user, sellerType: data.user.sellerType };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (updateUser) updateUser(updatedUser);
        setSuccessMessage(type === 'individual' ? 'You are now an Individual Seller. You can upload dog listings without a shop.' : 'You are set up as a Business Seller.');
        setShowIndividualConfirmation(false);
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        setError(data.message || 'Failed to set seller type');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleOpenUploadModal = () => {
    if (!canUploadDogs) {
      setError(isIndividualSeller ? 'Your seller account must be verified before uploading dogs.' : 'Activate your shop before uploading dogs.');
      return;
    }
    setError('');
    resetForm();
    setShowModal(true);
  };

  const getShopStatusLabel = (status) => {
    if (status === 'active' || status === 'approved') return 'Approved';
    if (status === 'pending') return 'Pending';
    if (status === 'rejected') return 'Rejected';
    return 'Not Created';
  };

  const getShopStatusColor = (status) => {
    if (status === 'active' || status === 'approved') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status === 'rejected') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getListingApprovalBadge = (dog) => {
    if (dog.status === 'Sold') {
      return { label: 'Sold', className: 'bg-red-100 text-red-800' };
    }
    if (dog.approvalStatus === 'rejected') {
      return { label: 'Rejected', className: 'bg-red-100 text-red-800' };
    }
    if (dog.approvalStatus === 'pending' || dog.approvalStatus === 'changes_requested') {
      return {
        label: dog.approvalStatus === 'changes_requested' ? 'Changes Requested' : 'Pending',
        className: 'bg-yellow-100 text-yellow-800'
      };
    }
    if (dog.approvalStatus === 'approved') {
      return { label: 'Approved', className: 'bg-green-100 text-green-800' };
    }
    return { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' };
  };

  const fetchMyShop = async () => {
    try {
      const data = await sellerShopApi.getMine();
      if (data.shop) {
        setMyShop(data.shop);
        setCurrentShopStatus(data.shop.status === 'approved' ? 'active' : data.shop.status);
        setCurrentShopName(data.shop.shopName);

        const existing = (() => {
          const stored = localStorage.getItem('user');
          if (!stored) return authUser || {};
          try { return JSON.parse(stored); } catch { return authUser || {}; }
        })();
        const updatedUser = {
          ...existing,
          shopName: data.shop.shopName,
          shopStatus: data.shop.status === 'approved' ? 'active' : data.shop.status
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (updateUser) updateUser(updatedUser);
      }
    } catch (err) {
      console.error('Failed to fetch shop', err);
    } finally {
      setShopChecked(true);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
    fetchDogs();
    if (!isIndividualSeller) {
      fetchMyShop();
    } else {
      setShopChecked(true);
    }
  }, [token, navigate]);

  useEffect(() => {
    if (shopStatus === 'active' && !isIndividualSeller) {
      fetchProducts();
    }
  }, [shopStatus, isIndividualSeller]);

  const scrollToListings = () => {
    if (listingsRef.current) {
      listingsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const fetchDogs = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/dogs/mine', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setDogs(data.listings);
      } else {
        setError(data.message || 'Failed to fetch your listings');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductLoading(true);
    setProductError('');
    try {
      const response = await fetch('http://localhost:5000/api/products/mine', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setProducts(data.products || []);
      } else {
        setProductError(data.message || 'Failed to fetch your products');
      }
    } catch (err) {
      setProductError('Network error. Please check your connection.');
    } finally {
      setProductLoading(false);
    }
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({ ...prev, [name]: value }));
    if (productError) setProductError('');
    if (productSuccess) setProductSuccess('');
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.description || !productForm.price) {
      setProductError('Please fill all required fields');
      return;
    }
    const stockQty = Number(productForm.stock);
    if (isNaN(stockQty) || stockQty < 0) {
      setProductError('Please enter a valid stock quantity (0 or more)');
      return;
    }
    setProductLoading(true);
    setProductError('');
    setProductSuccess('');
    try {
      const url = isEditingProduct 
        ? `http://localhost:5000/api/products/${editingProductId}`
        : 'http://localhost:5000/api/products';
      
      const method = isEditingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: productForm.name,
          description: productForm.description,
          price: parseFloat(productForm.price),
          stock: stockQty,
          category: productForm.category,
          image: productForm.image
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setProductSuccess(isEditingProduct ? 'Product updated successfully' : 'Product added to your shop');
        setProductForm({ name: '', description: '', price: '', stock: '', category: 'Other', image: '' });
        setIsEditingProduct(false);
        setEditingProductId(null);
        setTimeout(() => fetchProducts(), 500);
        setTimeout(() => setProductSuccess(''), 3000);
      } else {
        setProductError(data.message || 'Failed to save product');
      }
    } catch (err) {
      setProductError('Network error. Please check your connection.');
    } finally {
      setProductLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateImageFormat = (url) => {
    const validFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return true;
    }
    
    if (url.startsWith('data:image/')) {
      const format = url.split(';')[0].split('/')[1];
      return validFormats.includes(format);
    }
    
    const ext = url.split('.').pop().toLowerCase();
    return validFormats.includes(ext);
  };

  const validateForm = () => {
    if (!formData.name || !formData.breed || !formData.gender || !formData.age || !formData.price || !formData.location || !formData.healthStatus || !formData.description) {
      setImageUploadError('All required fields must be filled');
      return false;
    }

    if (isIndividualSeller && !formData.contactPhone) {
      setImageUploadError('Phone number is required for individual seller listings');
      return false;
    }

    if (isNaN(formData.age) || formData.age < 0) {
      setImageUploadError('Age must be a positive number');
      return false;
    }

    if (isNaN(formData.price) || formData.price < 0) {
      setImageUploadError('Price must be a positive number');
      return false;
    }

    const validImages = (formData.images || []).filter(img =>
      (typeof img === 'string' ? img.trim() : '').length > 0
    );
    
    if (validImages.length === 0) {
      setImageUploadError('At least one image is required');
      return false;
    }

    for (let img of validImages) {
      if (!validateImageFormat(img)) {
        setImageUploadError('Invalid image format. Supported: JPG, PNG, GIF, WebP, URLs');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setImageUploadError('');

    if (!validateForm()) {
      return;
    }

    const validImages = (formData.images || []).filter(img =>
      (typeof img === 'string' ? img.trim() : '').length > 0
    );

    const submitData = {
      ...formData,
      age: parseInt(formData.age),
      price: parseFloat(formData.price),
      images: validImages
    };

    try {
      const url = isEditMode 
        ? `http://localhost:5000/api/dogs/${editingDogId}`
        : 'http://localhost:5000/api/dogs';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.success) {
        if (isEditMode) {
          setSuccessMessage('Listing updated successfully!');
          resetForm();
          setShowModal(false);
        } else {
          setPreviewListing(data.listing);
          setShowModal(false);
          resetForm();
        }
        setTimeout(() => fetchDogs(), 500);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setImageUploadError(data.message || 'Failed to save listing');
      }
    } catch (err) {
      setImageUploadError('Network error. Please try again.');
    }
  };

  const handleEdit = (dog) => {
    setFormData({
      name: dog.name,
      breed: dog.breed,
      gender: dog.gender || 'Male',
      age: dog.age,
      price: dog.price,
      location: dog.location,
      contactPhone: dog.contactPhone || '',
      healthStatus: dog.healthStatus,
      images: dog.images || [],
      description: dog.description
    });
    setEditingDogId(dog._id);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleListingQuickAction = () => {
    if (hasIndividualListing) {
      handleEdit(dogs[0]);
    } else {
      handleOpenUploadModal();
    }
  };

  const handleDelete = async (dogId) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/dogs/${dogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Listing deleted successfully!');
        fetchDogs();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to delete listing');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleMarkAsSold = async (dogId) => {
    if (!window.confirm('Mark this dog as sold?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/dogs/${dogId}/sold`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Listing marked as sold!');
        fetchDogs();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to mark as sold');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  const handleEditProduct = (product) => {
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: (product.stock ?? 0).toString(),
      category: product.category || 'Other',
      image: product.image
    });
    setEditingProductId(product._id);
    setIsEditingProduct(true);
    if (productSectionRef.current) {
      productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setProductSuccess('Product deleted successfully');
        fetchProducts();
        setTimeout(() => setProductSuccess(''), 3000);
      } else {
        setProductError(data.message || 'Failed to delete product');
      }
    } catch (err) {
      setProductError('Network error. Please try again.');
    }
  };

  const resetProductForm = () => {
    setProductForm({ name: '', description: '', price: '', stock: '', category: 'Other', image: '' });
    setIsEditingProduct(false);
    setEditingProductId(null);
    setProductError('');
    setProductSuccess('');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      breed: '',
      gender: 'Male',
      age: '',
      price: '',
      location: '',
      contactPhone: '',
      healthStatus: 'Healthy',
      images: [],
      description: ''
    });
    setImageUploadError('');
    setIsEditMode(false);
    setEditingDogId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading || (!isIndividualSeller && !shopChecked)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isOnboardingPhase) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-2xl mx-auto">
              <span className="text-red-800">{error}</span>
            </div>
          )}
          {showIndividualConfirmation ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Individual Seller Registration</h2>
              <p className="text-gray-600 mb-4">
                As an Individual Seller, you can list dogs on the marketplace without creating a shop.
              </p>
              <ul className="space-y-2 text-gray-700 mb-6 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>List and manage dog listings only</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>No shop or product sales</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>Listings require admin approval before going live</span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleSetSellerType('individual')}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                >
                  Continue
                </button>
                <button
                  onClick={() => setShowIndividualConfirmation(false)}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold"
                >
                  Cancel / Back
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Seller Type</h2>
              <p className="text-gray-600 mb-6">Select how you want to sell on PawletApp to get started.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-orange-200 rounded-xl p-5 bg-orange-50">
                  <h3 className="font-semibold text-gray-900">Business Seller</h3>
                  <p className="text-sm text-gray-600 mt-2">Create a PawMart, upload dogs and products.</p>
                  <button
                    onClick={() => navigate('/seller/create-shop')}
                    className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-semibold"
                  >
                    Create PawMart
                  </button>
                </div>
                <div className="border border-indigo-200 rounded-xl p-5 bg-indigo-50">
                  <h3 className="font-semibold text-gray-900">Individual Seller</h3>
                  <p className="text-sm text-gray-600 mt-2">List dogs only. No shop required.</p>
                  <button
                    onClick={() => setShowIndividualConfirmation(true)}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold"
                  >
                    Individual Seller
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Individual Seller banner */}
        {isIndividualSeller && (
          <div className="mb-8 bg-indigo-50 border border-indigo-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="text-3xl">🐕</div>
              <div>
                <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">Individual Seller</p>
                <h2 className="text-xl font-bold text-gray-900">Dog Listings Only</h2>
                <p className="text-gray-600 mt-1">Upload and manage dog listings. No shop or products required.</p>
              </div>
            </div>
          </div>
        )}

        {/* Shop Status Card — business sellers only */}
        {!isIndividualSeller && (
        <div className="mb-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              {myShop?.logo ? (
                <img src={myShop.logo} alt={shopName} className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-orange-100 flex items-center justify-center text-2xl">🏪</div>
              )}
              <div>
                <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Your PawMart</p>
                <h2 className="text-xl font-bold text-gray-900">{shopName || 'No shop yet'}</h2>
                {myShop?.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{myShop.description}</p>
                )}
              </div>
            </div>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getShopStatusColor(shopStatus)}`}>
              {getShopStatusLabel(shopStatus)}
            </span>
          </div>
        </div>
        )}
        {/* Inactive shop - dog upload blocked */}
        {!isIndividualSeller && shopStatus !== 'active' && shopName && shopStatus !== 'pending' && shopStatus !== 'rejected' && (
          <div className="mb-8 bg-amber-50 border border-amber-300 rounded-xl p-5">
            <p className="text-amber-800 font-medium">Activate your shop before uploading dogs.</p>
          </div>
        )}

        {/* Pending approval banner - business sellers only */}
        {!isIndividualSeller && shopStatus === 'pending' && shopName && (
          <div className="mb-12 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-2xl p-8 shadow-md">
            <div className="flex items-start gap-4">
              <div className="text-4xl">⏳</div>
              <div>
                <p className="text-sm uppercase tracking-widest text-yellow-600 font-bold">Awaiting Admin Approval</p>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">Your shop is under review</h2>
                <p className="text-gray-600 mt-2">Activate your shop before uploading dogs. Our admin team will review your shop shortly.</p>
              </div>
            </div>
          </div>
        )}

        {/* Rejected shop banner - business sellers only */}
        {!isIndividualSeller && shopStatus === 'rejected' && (
          <div className="mb-12 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-2xl p-8 shadow-md">
            <div className="flex items-start gap-4">
              <div className="text-4xl">❌</div>
              <div className="flex-1">
                <p className="text-sm uppercase tracking-widest text-red-600 font-bold">PawMart Rejected</p>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">Your shop application was not approved</h2>
                {myShop?.rejectionFeedback && (
                  <p className="text-gray-700 mt-2"><span className="font-semibold">Admin feedback:</span> {myShop.rejectionFeedback}</p>
                )}
                <p className="text-gray-600 mt-2">You can update your shop details and resubmit for approval.</p>
                <button
                  onClick={() => navigate('/seller/create-shop')}
                  className="mt-4 px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Resubmit PawMart Application
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Shop creation required - business sellers only */}
        {!isIndividualSeller && (shopStatus === 'inactive' || !shopName) && (
          <div className="mb-12 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300 rounded-2xl p-8 shadow-md">
            <div className="max-w-3xl">
              <div className="flex items-start gap-4 mb-6">
                <div className="text-4xl">🏪</div>
                <div className="flex-1">
                  <p className="text-sm uppercase tracking-widest text-orange-600 font-bold">PawMart Setup Required</p>
                  <h2 className="text-3xl font-bold text-gray-900 mt-2">Create Your PawMart to Get Started</h2>
                  <p className="text-lg text-gray-700 mt-3">You need to set up your shop before you can add and manage products. This only takes a minute!</p>
                  <ul className="mt-4 space-y-2 text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Choose a unique shop name</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Write a brief description about your shop</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500 font-bold">•</span>
                      <span>Add your contact information</span>
                    </li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => navigate('/seller/create-shop')}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl cursor-pointer inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create PawMart Now
              </button>
            </div>
          </div>
        )}

        {/* Shop Products Section - business sellers with active shop only */}
        {!isIndividualSeller && shopStatus === 'active' && shopName && (
        <div ref={productSectionRef} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-orange-500 font-semibold">PawMart</p>
              <h3 className="mt-1 text-2xl font-bold text-gray-900">PawMart Products</h3>
              <p className="text-sm text-gray-600 mt-1">Add and manage your shop items</p>
            </div>
          </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create/Edit Product Form */}
              <div className="lg:col-span-1">
                <form onSubmit={handleCreateProduct} className="space-y-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {isEditingProduct ? 'Edit Product' : 'Add New Product'}
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={productForm.name}
                      onChange={handleProductChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter Product Name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      name="description"
                      value={productForm.description}
                      onChange={handleProductChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Comfortable, washable, pet-safe materials"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      name="category"
                      value={productForm.category}
                      onChange={handleProductChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      {productCategories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                    <input
                      type="number"
                      name="stock"
                      min="0"
                      step="1"
                      value={productForm.stock}
                      onChange={handleProductChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="10"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (PKR) *</label>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      value={productForm.price}
                      onChange={handleProductChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Enter Price"
                      required
                    />
                  </div>
                  <div>
                      <ImageUpload 
                        label="Product Image"
                        currentImage={productForm.image}
                        onImageSelect={(imageData) => {
                          setProductForm(prev => ({
                            ...prev,
                            image: imageData.url
                          }));
                        }}
                        maxSize={5}
                      />
                  </div>
                  {productError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                      {productError}
                    </div>
                  )}
                  {productSuccess && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                      {productSuccess}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={productLoading}
                      className={`flex-1 py-3 rounded-full text-white font-semibold shadow ${productLoading ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
                    >
                      {productLoading ? 'Saving...' : (isEditingProduct ? 'Update Product' : 'Add Product')}
                    </button>
                    {isEditingProduct && (
                      <button
                        type="button"
                        onClick={resetProductForm}
                        className="px-4 py-3 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Product List */}
              <div className="lg:col-span-2">
                {productLoading && products.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                  </div>
                ) : products.length === 0 ? (
                  <div className="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-600">
                    No products yet. Add your first product to get started.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map((product) => (
                      <div key={product._id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                        <div className="h-40 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl" style={{display: product.image ? 'none' : 'flex'}}>
                            📦
                          </div>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{product.description}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xl font-bold text-orange-500">{formatPrice(product.price, { decimals: false })}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
        </div>
        )}

        {/* Quick actions - Always visible */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">List a dog</p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">
                {hasIndividualListing ? 'Update Dog Listing' : 'Upload Dog Listing'}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {hasIndividualListing
                  ? 'Edit your existing dog listing with updated photos and details.'
                  : 'Add a new dog listing with photos and details.'}
              </p>
            </div>
            <button
              onClick={handleListingQuickAction}
              className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
            >
              {hasIndividualListing ? 'Update Listing' : 'Upload Listing'}
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">Manage</p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">Manage Dog Listings</h3>
              <p className="text-sm text-gray-600 mt-2">Edit, mark sold, or remove existing listings.</p>
            </div>
            <button
              onClick={scrollToListings}
              className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-semibold"
            >
              View Listings
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-indigo-600 font-semibold">PawMart</p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">
                {isIndividualSeller ? 'Not Applicable' : shopStatus === 'active' ? 'Manage PawMart Products' : 'Create PawMart'}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {isIndividualSeller
                  ? 'Individual sellers list dogs only.'
                  : shopStatus === 'active'
                  ? 'Add or manage products for your active PawMart.'
                  : 'Create your PawMart to start selling products.'}
              </p>
            </div>
            {!isIndividualSeller && (shopStatus === 'active' ? (
              <button
                onClick={() => {
                  if (productSectionRef.current) {
                    productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-semibold"
              >
                Manage Products
              </button>
            ) : (
              <button
                onClick={() => navigate('/seller/create-shop')}
                className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-semibold"
              >
                Create PawMart
              </button>
            ))}
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-800">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">My Dog Listings</h2>
            <p className="text-gray-600 mt-1">Create and manage your listings</p>
          </div>
          <button
            onClick={handleOpenUploadModal}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Listing
          </button>
        </div>

        {/* Listings Grid */}
        <div ref={listingsRef} />
        {dogs.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
            <p className="text-gray-600 mb-4">Create your first dog listing to get started</p>
            <button
              onClick={handleOpenUploadModal}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create First Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dogs.map(dog => {
              const approvalBadge = getListingApprovalBadge(dog);
              return (
              <div key={dog._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="h-48 bg-gray-200">
                  {dog.images && dog.images.length > 0 ? (
                    <img
                      src={dog.images[0]}
                      alt={dog.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1633722715463-d30628519d00?w=400&h=300&fit=crop';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="text-xl font-semibold text-gray-900">{dog.name}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${approvalBadge.className}`}>
                      {approvalBadge.label}
                    </span>
                  </div>

                  {(dog.approvalStatus === 'rejected' || dog.approvalStatus === 'changes_requested') && dog.adminFeedback && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                      <span className="font-semibold">Reason: </span>{dog.adminFeedback}
                    </div>
                  )}

                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    <p><span className="font-medium text-gray-700">Breed:</span> {dog.breed}</p>
                    {dog.gender && (
                      <p><span className="font-medium text-gray-700">Gender:</span> {dog.gender}</p>
                    )}
                    <p><span className="font-medium text-gray-700">Age:</span> {dog.age} years</p>
                    <p><span className="font-medium text-gray-700">Price:</span> {formatPrice(dog.price, { decimals: false })}</p>
                    <p><span className="font-medium text-gray-700">Location:</span> {dog.location}</p>
                    <p><span className="font-medium text-gray-700">Health:</span> {dog.healthStatus}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(dog)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Edit
                    </button>
                    {dog.status === 'Available' && dog.approvalStatus === 'approved' && (
                      <button
                        onClick={() => handleMarkAsSold(dog._id)}
                        className="flex-1 px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                      >
                        Sold
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(dog._id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b flex justify-between items-center p-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditMode ? 'Edit Listing' : 'Create New Listing'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image Upload Error */}
              {imageUploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  {imageUploadError}
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter Dog Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Breed *</label>
                  <input
                    type="text"
                    name="breed"
                    value={formData.breed}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter Dog Breed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age (years) *</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleFormChange}
                    required
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (Rs.) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleFormChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{isIndividualSeller ? 'City *' : 'Location *'}</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={isIndividualSeller ? 'Enter City' : 'Enter City'}
                  />
                </div>

                {isIndividualSeller && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter Phone Number"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Health Status *</label>
                  <select
                    name="healthStatus"
                    value={formData.healthStatus}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Vaccinated">Vaccinated</option>
                    <option value="Neutered/Spayed">Neutered/Spayed</option>
                    <option value="Under Treatment">Under Treatment</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Additional details about the dog..."
                ></textarea>
              </div>

              {/* Images */}
              <div>
                <MultiImageUpload 
                  label="Dog Images"
                  currentImages={formData.images}
                  onImagesSelect={(images) => {
                    setFormData(prev => ({
                      ...prev,
                      images: images
                    }));
                  }}
                  maxSize={5}
                  maxImages={5}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  {isEditMode ? 'Update Listing' : 'Create Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Listing Preview Modal */}
      {previewListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Listing Submitted</h2>
              <p className="text-green-700 mt-1">Your dog listing has been submitted for admin approval.</p>
            </div>
            <div className="p-6">
              {previewListing.images?.[0] && (
                <img
                  src={previewListing.images[0]}
                  alt={previewListing.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-xl font-semibold text-gray-900">{previewListing.name}</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Breed:</span> {previewListing.breed}</p>
                {previewListing.gender && <p><span className="font-medium">Gender:</span> {previewListing.gender}</p>}
                <p><span className="font-medium">Age:</span> {previewListing.age} years</p>
                <p><span className="font-medium">Price:</span> {formatPrice(previewListing.price, { decimals: false })}</p>
                <p><span className="font-medium">Location:</span> {previewListing.location}</p>
                <p><span className="font-medium">Health:</span> {previewListing.healthStatus}</p>
                {previewListing.description && (
                  <p><span className="font-medium">Description:</span> {previewListing.description}</p>
                )}
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={() => {
                  setPreviewListing(null);
                  setSuccessMessage('Listing created successfully!');
                }}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              >
                Done
              </button>
              <button
                onClick={() => {
                  const listingId = previewListing._id;
                  setPreviewListing(null);
                  navigate(`/dogs/${listingId}`);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SellerDashboard;
