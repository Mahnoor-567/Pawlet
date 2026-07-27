import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ showUserMenu = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const role = user?.role || (typeof window !== 'undefined' ? localStorage.getItem('role') : null);

  const goToDashboard = () => {
    const currentRole = user?.role || (typeof window !== 'undefined' ? localStorage.getItem('role') : null);

    if (currentRole === 'admin') {
      navigate('/admin-dashboard');
      return;
    }

    if (currentRole === 'seller') {
      navigate('/seller-dashboard');
      return;
    }

    if (currentRole === 'writer') {
      navigate('/writer-dashboard');
      return;
    }

    if (currentRole === 'expert') {
      navigate('/forum');
      return;
    }

    navigate('/user-dashboard');
  };
  const handleLogout = () => {
    logout();
    setShowMenu(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="text-2xl font-bold text-orange-500 hover:text-orange-600 transition-colors"
          >
            PawletApp
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => navigate('/')}
              className={`transition-colors ${
                isActive('/')
                  ? 'text-orange-500 font-semibold'
                  : 'text-gray-700 hover:text-orange-500'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => navigate('/marketplace')}
              className={`transition-colors ${
                isActive('/marketplace')
                  ? 'text-orange-500 font-semibold'
                  : 'text-gray-700 hover:text-orange-500'
              }`}
            >
              Marketplace
            </button>

            <button
              onClick={() => navigate('/shop')}
              className={`transition-colors ${
                isActive('/shop')
                  ? 'text-orange-500 font-semibold'
                  : 'text-gray-700 hover:text-orange-500'
              }`}
            >
              PawMart
            </button>

            <button
              onClick={() => navigate('/blogs')}
              className={`transition-colors ${
                isActive('/blogs')
                  ? 'text-orange-500 font-semibold'
                  : 'text-gray-700 hover:text-orange-500'
              }`}
            >
              Blog
            </button>

            <button
              onClick={() => navigate('/forum')}
              className={`transition-colors ${
                isActive('/forum')
                  ? 'text-orange-500 font-semibold'
                  : 'text-gray-700 hover:text-orange-500'
              }`}
            >
              Community Forum
            </button>

            <button
              onClick={() => navigate('/chatbot')}
              className={`transition-colors ${
                isActive('/chatbot')
                  ? 'text-orange-500 font-semibold'
                  : 'text-gray-700 hover:text-orange-500'
              }`}
            >
              AI Chatbot
            </button>

          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated() ? (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-700 font-medium hidden sm:block">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      My Profile
                    </button>

                    <button
                      onClick={() => {
                          goToDashboard();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Dashboard
                    </button>

                    <hr className="my-2" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-orange-500 hover:text-orange-600 font-medium transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden text-gray-700 hover:text-orange-500"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <div className="md:hidden pb-4 space-y-2">
            <button
              onClick={() => {
                navigate('/');
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Home
            </button>

            <button
              onClick={() => {
                navigate('/marketplace');
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Marketplace
            </button>

            <button
              onClick={() => {
                navigate('/shop');
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              PawMart
            </button>

            <button
              onClick={() => {
                navigate('/blogs');
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Blog
            </button>

            <button
              onClick={() => {
                navigate('/forum');
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Community Forum
            </button>

            <button
              onClick={() => {
                navigate('/chatbot');
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              AI Chatbot
            </button>

          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
