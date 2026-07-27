import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils/formatPrice';

const Landing = () => {
  const navigate = useNavigate();
  const [featuredDogs, setFeaturedDogs] = useState([]);
  const [dogsLoading, setDogsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedDogs = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dogs?limit=4');
        const data = await response.json();
        if (data.success) {
          setFeaturedDogs(data.listings || []);
        }
      } catch (err) {
        console.error('Failed to fetch featured dogs', err);
      } finally {
        setDogsLoading(false);
      }
    };
    fetchFeaturedDogs();
  }, []);

  const getDogImage = (dog) => {
    if (dog.images && dog.images.length > 0) {
      return dog.images[0];
    }
    return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=300&fit=crop';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="pt-8 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text Content */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Find Your Perfect
                <span className="text-orange-500 block mt-2">Furry Friend</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Discover loving companions waiting for their forever home. Browse our curated selection of healthy, happy puppies ready to bring joy to your family.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/marketplace')}
                  className="px-8 py-4 bg-orange-500 text-white text-lg font-semibold rounded-full hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Explore Dogs
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 bg-white text-orange-500 text-lg font-semibold rounded-full border-2 border-orange-500 hover:bg-orange-50 transition-colors shadow-md"
                >
                  Join as Seller
                </button>
              </div>
            </div>

            {/* Right Side - Hero Image */}
            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop"
                  alt="Happy dog"
                  className="rounded-3xl shadow-2xl w-full h-auto object-cover"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=600&fit=crop';
                  }}
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-72 h-72 bg-orange-200 rounded-full opacity-30 blur-3xl -z-10"></div>
              <div className="absolute -bottom-6 -left-6 w-72 h-72 bg-yellow-200 rounded-full opacity-30 blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories Section */}
      <section id="services" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-xl text-gray-600">Everything your furry friend needs in one place</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Service Card 1 - Marketplace */}
            <div
              onClick={() => navigate('/marketplace')}
              className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
            >
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Adopt a Dog</h3>
              <p className="text-gray-600 mb-4">Find your perfect companion from our verified breeders and loving homes.</p>
              <span className="text-orange-500 font-semibold text-sm group-hover:underline">Browse Marketplace →</span>
            </div>

            {/* Service Card 2 - Shop */}
            <div
              onClick={() => navigate('/shop')}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
            >
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Pet Supplies</h3>
              <p className="text-gray-600 mb-4">Premium food, toys, and accessories for your beloved pets.</p>
              <span className="text-blue-500 font-semibold text-sm group-hover:underline">Visit PawMart →</span>
            </div>

            {/* Service Card 3 - Pet Blogs */}
            <div
              onClick={() => navigate('/blogs')}
              className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
            >
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Pet Blogs</h3>
              <p className="text-gray-600 mb-4">Expert guides, care tips, and stories from the pet community.</p>
              <span className="text-green-500 font-semibold text-sm group-hover:underline">Read Blogs →</span>
            </div>

            {/* Service Card 4 - Forum */}
            <div
              onClick={() => navigate('/forum')}
              className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
            >
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Community Forum</h3>
              <p className="text-gray-600 mb-4">Connect with pet lovers, ask questions, and share experiences.</p>
              <span className="text-purple-500 font-semibold text-sm group-hover:underline">Join Forum →</span>
            </div>
          </div>
        </div>
      </section>

      {/* Available Dogs Preview Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-orange-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Available Dogs</h2>
            <p className="text-xl text-gray-600">Meet some of our adorable puppies looking for homes</p>
          </div>

          {dogsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading available dogs...</p>
            </div>
          ) : featuredDogs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-md">
              <div className="text-6xl mb-4">🐕</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No dogs available yet</h3>
              <p className="text-gray-600 mb-6">Check back soon for newly approved listings on our marketplace.</p>
              <button
                onClick={() => navigate('/marketplace')}
                className="px-8 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors"
              >
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredDogs.map((dog) => (
                <div
                  key={dog._id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={getDogImage(dog)}
                      alt={dog.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=300&fit=crop';
                      }}
                    />
                    <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {formatPrice(dog.price, { decimals: false })}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{dog.name}</h3>
                    <p className="text-gray-600 mb-1">
                      <span className="font-semibold">Breed:</span> {dog.breed}
                    </p>
                    <p className="text-gray-600 mb-4">
                      <span className="font-semibold">Age:</span> {dog.age} {dog.age === 1 ? 'year' : 'years'}
                    </p>
                    <button
                      onClick={() => navigate(`/dogs/${dog._id}`)}
                      className="w-full px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors shadow-md"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {featuredDogs.length > 0 && (
            <div className="text-center mt-12">
              <button
                onClick={() => navigate('/marketplace')}
                className="px-10 py-4 bg-gray-900 text-white text-lg font-semibold rounded-full hover:bg-gray-800 transition-colors shadow-lg"
              >
                View All Dogs
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Welcome a New Family Member?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join thousands of happy pet owners who found their perfect companion through Pawlet. Start your journey today!
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-10 py-4 bg-white text-orange-500 text-lg font-bold rounded-full hover:bg-gray-100 transition-colors shadow-xl transform hover:scale-105"
          >
            Get Started Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand Column */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white">PawletApp</h2>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Your trusted platform for finding healthy, happy puppies from verified breeders. Making pet adoption simple, safe, and joyful.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => navigate('/')} className="text-gray-400 hover:text-orange-500 transition-colors">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/marketplace')} className="text-gray-400 hover:text-orange-500 transition-colors">
                    Marketplace
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    Services
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/shop')} className="text-gray-400 hover:text-orange-500 transition-colors">
                    PawMart
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-orange-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-400">support@pawlet.pk</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-orange-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-400">+92 3XX XXXXXXX</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-orange-500 mr-2 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-400">Islamabad, Pakistan</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">
                © {new Date().getFullYear()} PawletApp. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
