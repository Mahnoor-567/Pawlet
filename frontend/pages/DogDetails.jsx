import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatPrice } from '../utils/formatPrice';

const DogDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [dog, setDog] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [showContactForm, setShowContactForm] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);

  useEffect(() => {
    fetchDogDetails();
  }, [id]);

  const fetchDogDetails = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/dogs/${id}`);
      const data = await response.json();

      if (data.success) {
        setDog(data.listing);
        setSeller(data.seller);
      } else {
        if (data.status === 'Sold' || data.message === 'This dog is no longer available.') {
          setIsUnavailable(true);
        }
        setError(data.message || 'Failed to fetch dog details');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send to backend
    // For now, we'll open email client or show success message
    const mailtoLink = `mailto:${seller.email}?subject=Inquiry about ${dog.name}&body=${encodeURIComponent(
      `Hello ${seller.name},\n\nI am interested in ${dog.name} (${dog.breed}). \n\n${contactForm.message}\n\nContact me at:\nName: ${contactForm.name}\nEmail: ${contactForm.email}\nPhone: ${contactForm.phone}`
    )}`;
    window.location.href = mailtoLink;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-indigo-600">PawletApp</h1>
              <button
                onClick={() => navigate('/marketplace')}
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                ← Back to Marketplace
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className={`border rounded-lg p-6 ${isUnavailable ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center">
              <svg className={`w-6 h-6 mr-3 ${isUnavailable ? 'text-amber-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                {isUnavailable ? (
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                )}
              </svg>
              <div>
                <h3 className={`text-lg font-semibold mb-1 ${isUnavailable ? 'text-amber-800' : 'text-red-800'}`}>
                  {isUnavailable ? 'No Longer Available' : 'Error'}
                </h3>
                <p className={isUnavailable ? 'text-amber-700' : 'text-red-700'}>{error}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!dog) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="h-96 bg-gray-200">
                {dog.images && dog.images.length > 0 ? (
                  <img
                    src={dog.images[selectedImageIndex]}
                    alt={dog.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1633722715463-d30628519d00?w=600&h=400&fit=crop';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image Available
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {dog.images && dog.images.length > 1 && (
                <div className="p-4 bg-white border-t flex gap-2 overflow-x-auto">
                  {dog.images.map((image, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === idx
                          ? 'border-indigo-600'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${dog.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1633722715463-d30628519d00?w=100&h=100&fit=crop';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dog Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{dog.name}</h1>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm font-medium">Breed</p>
                  <p className="text-xl font-semibold text-gray-900">{dog.breed}</p>
                </div>
                {dog.gender && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 text-sm font-medium">Gender</p>
                    <p className="text-xl font-semibold text-gray-900">{dog.gender}</p>
                  </div>
                )}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm font-medium">Age</p>
                  <p className="text-xl font-semibold text-gray-900">{dog.age} years</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm font-medium">Location</p>
                  <p className="text-xl font-semibold text-gray-900">{dog.location}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600 text-sm font-medium">Health Status</p>
                  <p className="text-xl font-semibold text-gray-900">{dog.healthStatus}</p>
                </div>
              </div>

              {/* Description */}
              {dog.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{dog.description}</p>
                </div>
              )}

              {/* Price */}
              <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                <p className="text-gray-600 text-sm mb-2">Price</p>
                <p className="text-4xl font-bold text-indigo-600">{formatPrice(dog.price, { decimals: false })}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Seller Info and Contact */}
          <div className="lg:col-span-1">
            {/* Seller Card */}
            {seller && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6 sticky top-20">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-indigo-600">
                    {seller.name?.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{seller.name}</h3>
                  {seller.sellerType === 'individual' ? (
                    <p className="text-indigo-600 font-medium mt-1">Individual Seller</p>
                  ) : seller.shopName ? (
                    <p className="text-indigo-600 font-medium mt-1">{seller.shopName}</p>
                  ) : null}
                </div>

                {/* Contact Information */}
                <div className="space-y-4 mb-6 border-t border-b py-6">
                  {seller.sellerType === 'individual' && seller.city && (
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">City</p>
                        <p className="text-gray-900">{seller.city}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                    </svg>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Email</p>
                      <a href={`mailto:${seller.email}`} className="text-indigo-600 hover:underline">
                        {seller.email}
                      </a>
                    </div>
                  </div>

                  {seller.phone && seller.phone !== 'Not provided' && (
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-indigo-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.58 1.318 1.52 2.258 2.837 3.838l.773-1.548a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2.57c-6.055 0-11.066-5.007-11.066-11.066V3z"></path>
                      </svg>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Phone</p>
                        <a href={`tel:${seller.phone}`} className="text-indigo-600 hover:underline">
                          {seller.phone}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowContactForm(!showContactForm)}
                    className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Message
                  </button>

                  <a
                    href={`tel:${seller.phone}`}
                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call Seller
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && seller && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">Contact {seller.name}</h3>
                <button
                  onClick={() => setShowContactForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
                  <input
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={contactForm.phone}
                    onChange={handleContactFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    name="message"
                    value={contactForm.message}
                    onChange={handleContactFormChange}
                    required
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Tell them about your interest in this dog..."
                  ></textarea>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DogDetails;
