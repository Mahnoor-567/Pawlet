import React, { useState, useEffect } from 'react';
import { formatPrice } from '../utils/formatPrice';
import { useNavigate } from 'react-router-dom';

const Marketplace = () => {
  const navigate = useNavigate();
  const [dogs, setDogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    breed: '',
    ageMin: '',
    ageMax: '',
    location: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1
  });

  // Fetch dogs on component mount and when filters change
  useEffect(() => {
    fetchDogs();
  }, [filters, pagination.page]);

  const fetchDogs = async () => {
    setLoading(true);
    setError('');

    try {
      // Build query string
      const params = new URLSearchParams();
      
      if (filters.breed) params.append('breed', filters.breed);
      if (filters.ageMin) params.append('ageMin', filters.ageMin);
      if (filters.ageMax) params.append('ageMax', filters.ageMax);
      if (filters.location) params.append('location', filters.location);
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);

      const response = await fetch(`http://localhost:5000/api/dogs?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setDogs(data.listings);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          pages: data.pages
        }));
      } else {
        setError(data.message || 'Failed to fetch listings');
        setDogs([]);
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setDogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      breed: '',
      ageMin: '',
      ageMax: '',
      location: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleViewDetails = (dogId) => {
    navigate(`/dogs/${dogId}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Marketplace</h2>
          <p className="text-gray-600">Find your perfect furry companion</p>
        </div>

        {/* Error Alert */}
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

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <button
              onClick={handleResetFilters}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Breed Filter */}
            <div>
              <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-2">
                Breed
              </label>
              <input
                type="text"
                id="breed"
                name="breed"
                value={filters.breed}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Age Min Filter */}
            <div>
              <label htmlFor="ageMin" className="block text-sm font-medium text-gray-700 mb-2">
                Min Age (years)
              </label>
              <input
                type="number"
                id="ageMin"
                name="ageMin"
                value={filters.ageMin}
                onChange={handleFilterChange}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Age Max Filter */}
            <div>
              <label htmlFor="ageMax" className="block text-sm font-medium text-gray-700 mb-2">
                Max Age (years)
              </label>
              <input
                type="number"
                id="ageMax"
                name="ageMax"
                value={filters.ageMax}
                onChange={handleFilterChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Location Filter */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                placeholder="Enter City"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Loading listings...</p>
            </div>
          </div>
        )}

        {/* No Dogs Available */}
        {!loading && dogs.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No dogs available</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters or check back later</p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Dogs Grid */}
        {!loading && dogs.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {dogs.map(dog => (
                <div key={dog._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Dog Image */}
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    {dog.images && dog.images.length > 0 ? (
                      <img
                        src={dog.images[0]}
                        alt={dog.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
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

                  {/* Dog Details */}
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{dog.name}</h3>
                    
                    <div className="space-y-1 mb-4 text-sm text-gray-600">
                      <p><span className="font-medium text-gray-700">Breed:</span> {dog.breed}</p>
                      {dog.gender && (
                        <p><span className="font-medium text-gray-700">Gender:</span> {dog.gender}</p>
                      )}
                      <p><span className="font-medium text-gray-700">Age:</span> {dog.age} year{dog.age !== 1 ? 's' : ''}</p>
                      <p><span className="font-medium text-gray-700">{dog.seller?.sellerType === 'individual' ? 'City' : 'Location'}:</span> {dog.location}</p>
                      <p><span className="font-medium text-gray-700">Health:</span> {dog.healthStatus}</p>
                      {dog.seller && (
                        <p className="pt-1 border-t border-gray-100 mt-2">
                          <span className="font-medium text-gray-700">Seller:</span>{' '}
                          {dog.seller.sellerType === 'individual' ? (
                            <>Individual Seller · {dog.seller.phone !== 'Not provided' ? dog.seller.phone : '—'} · {dog.location}</>
                          ) : (
                            dog.seller.displayLabel || dog.seller.shopName || 'Business Seller'
                          )}
                        </p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-indigo-600">{formatPrice(dog.price, { decimals: false })}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Available
                      </span>
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={() => handleViewDetails(dog._id)}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center gap-2 mb-8">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pagination.page === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Previous
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      page === pagination.page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pagination.page === pagination.pages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  Next
                </button>
              </div>
            )}

            {/* Results Summary */}
            <div className="text-center text-gray-600">
              <p>Showing {dogs.length} of {pagination.total} listings (Page {pagination.page} of {pagination.pages})</p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Marketplace;
