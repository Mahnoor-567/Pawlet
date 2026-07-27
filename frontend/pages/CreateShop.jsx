import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ImageUpload from './ImageUpload';
import { sellerShopApi } from '../services/shopApi';

const FIELD_ERRORS = {
  shopName: '',
  description: '',
  contactInfo: '',
  logo: ''
};

const CreateShop = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    shopName: '',
    description: '',
    contactInfo: '',
    logo: ''
  });
  const [fieldErrors, setFieldErrors] = useState(FIELD_ERRORS);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingShop, setCheckingShop] = useState(true);

  useEffect(() => {
    const checkExistingShop = async () => {
      try {
        const data = await sellerShopApi.getMine();
        const shop = data.shop;
        if (shop && (shop.status === 'pending' || shop.status === 'approved')) {
          navigate('/seller-dashboard', {
            replace: true,
            state: { message: 'You already have a shop on file.' }
          });
        } else if (shop && shop.status === 'rejected') {
          setForm({
            shopName: shop.shopName || '',
            description: shop.description || '',
            contactInfo: shop.contactInfo || '',
            logo: shop.logo || ''
          });
        }
      } catch (err) {
        console.error('Failed to check existing shop', err);
      } finally {
        setCheckingShop(false);
      }
    };
    checkExistingShop();
  }, [navigate]);

  const validateForm = () => {
    const errors = { ...FIELD_ERRORS };
    let valid = true;

    if (!form.shopName.trim()) {
      errors.shopName = 'PawMart name is required';
      valid = false;
    } else if (form.shopName.trim().length < 2 || form.shopName.trim().length > 80) {
      errors.shopName = 'PawMart name must be between 2 and 80 characters';
      valid = false;
    }

    if (!form.description.trim()) {
      errors.description = 'Description is required';
      valid = false;
    } else if (form.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
      valid = false;
    }

    if (!form.contactInfo.trim()) {
      errors.contactInfo = 'Contact information is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactInfo.trim()) && !/^[+\d\s()-]{7,20}$/.test(form.contactInfo.trim())) {
      errors.contactInfo = 'Enter a valid email or phone number';
      valid = false;
    }

    setFieldErrors(errors);
    return valid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
  };

  const handleLogoSelect = ({ url }) => {
    setForm((prev) => ({ ...prev, logo: url }));
    if (fieldErrors.logo) {
      setFieldErrors((prev) => ({ ...prev, logo: '' }));
    }
  };

  const persistUserShop = (data) => {
    try {
      const existing = (() => {
        const stored = localStorage.getItem('user');
        if (!stored) return user || {};
        try { return JSON.parse(stored); } catch { return user || {}; }
      })();

      const updatedUser = {
        ...existing,
        ...(data.user || {}),
        shopName: data.user?.shopName || data.shop?.shopName || form.shopName.trim(),
        shopStatus: data.user?.shopStatus || (data.shop?.status === 'approved' ? 'active' : data.shop?.status) || 'pending',
        role: data.user?.role || 'seller',
        isSeller: data.user?.isSeller !== undefined ? data.user.isSeller : true
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('role', updatedUser.role);
      if (updateUser) updateUser(updatedUser);
    } catch (err) {
      console.error('Failed to persist shop locally', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const data = await sellerShopApi.create({
        shopName: form.shopName.trim(),
        description: form.description.trim(),
        contactInfo: form.contactInfo.trim(),
        logo: form.logo
      });

      persistUserShop(data);
      setSuccessMessage(data.message || 'PawMart submitted for admin approval.');

      setTimeout(() => {
        navigate('/seller-dashboard', {
          state: { message: data.message || 'PawMart submitted for admin approval.' }
        });
      }, 1500);
    } catch (err) {
      const message = err.message || 'Failed to create shop';
      if (message.toLowerCase().includes('shop name')) {
        setFieldErrors((prev) => ({ ...prev, shopName: message }));
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingShop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-widest text-orange-600 font-bold">Seller Setup</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Create Your PawMart</h1>
          <p className="text-gray-600 mt-2">Set up your PawMart profile. An admin will review and approve it before you can list products.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PawMart Name *</label>
              <input
                type="text"
                name="shopName"
                value={form.shopName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  fieldErrors.shopName ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="Enter PawMart Name"
              />
              {fieldErrors.shopName && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.shopName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  fieldErrors.description ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="Tell buyers about your shop, products, and services"
              />
              {fieldErrors.description && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
              )}
            </div>

            <div>
              <ImageUpload
                label="PawMart Logo"
                currentImage={form.logo}
                onImageSelect={handleLogoSelect}
              />
              {fieldErrors.logo && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.logo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Information *</label>
              <input
                type="text"
                name="contactInfo"
                value={form.contactInfo}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  fieldErrors.contactInfo ? 'border-red-400' : 'border-gray-300'
                }`}
                placeholder="Enter Phone Number"
              />
              {fieldErrors.contactInfo && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.contactInfo}</p>
              )}
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                {successMessage}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/seller-dashboard')}
                className="flex-1 px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 px-4 py-3 rounded-lg text-white font-semibold shadow ${
                  loading ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit PawMart for Approval'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateShop;
