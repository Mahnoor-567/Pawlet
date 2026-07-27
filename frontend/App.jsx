import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Marketplace from './pages/Marketplace';
import DogDetails from './pages/DogDetails';
import SellerDashboard from './pages/SellerDashboard';
import CreateShop from './pages/CreateShop';
import Shop from './pages/Shop';
import Blogs from './pages/Blogs';
import BlogDetails from './pages/BlogDetails';
import BlogDashboard from './pages/BlogDashboard';
import WriterBlogPreview from './pages/WriterBlogPreview';
import Forum from './pages/Forum';
import ForumDetail from './pages/ForumDetail';
import AIChatbot from './pages/AIChatbot';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import Unauthorized from './pages/Unauthorized';

// ─── Route Guards ─────────────────────────────────────────────────────────────

const LoadingSpinner = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading...</p>
    </div>
  </div>
);

// General protected route — any authenticated user
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  if (allowedRoles.length > 0) {
    const userRole = user?.role || storedRole;
    if (!allowedRoles.includes(userRole)) {
      const fallback = userRole === 'admin'
        ? '/admin-dashboard'
        : userRole === 'seller'
        ? '/seller-dashboard'
        : userRole === 'writer'
        ? '/writer-dashboard'
        : userRole === 'expert'
        ? '/forum'
        : '/user-dashboard';
      return <Navigate to={fallback} replace state={{ warning: 'You do not have permission to access this page.' }} />;
    }
  }

  return children;
};

// Buyer (user role) only
const BuyerProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  const role = user?.role || storedRole;
  if (role !== 'user') {
    if (role === 'writer') return <Navigate to="/writer-dashboard" replace />;
    if (role === 'seller') return <Navigate to="/seller-dashboard" replace />;
    if (role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (role === 'expert') return <Navigate to="/forum" replace />;
    return <Navigate to="/user-dashboard" replace />;
  }

  return children;
};

// Seller only
const SellerProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  const role = user?.role || storedRole;
  if (role !== 'seller') {
    if (role === 'writer') return <Navigate to="/writer-dashboard" replace />;
    return <Navigate to="/user-dashboard" replace />;
  }

  return children;
};

// Writer only
const WriterProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  const role = user?.role || storedRole;
  if (role !== 'writer') return <Navigate to="/user-dashboard" replace />;

  return children;
};

// Admin only — redirects to dedicated Unauthorized page for non-admins
const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('role') : null;

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  const role = user?.role || storedRole;
  if (role !== 'admin') return <Navigate to="/unauthorized" replace />;

  return children;
};

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/dogs/:id" element={<DogDetails />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:id" element={<BlogDetails />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:id" element={<ForumDetail />} />
          <Route path="/chatbot" element={<AIChatbot />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/products/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* User Dashboard */}
          <Route path="/user-dashboard" element={<BuyerProtectedRoute><Dashboard /></BuyerProtectedRoute>} />
          {/* Legacy redirect */}
          <Route path="/dashboard" element={<Navigate to="/user-dashboard" replace />} />

          {/* Seller Dashboard */}
          <Route path="/seller-dashboard" element={<SellerProtectedRoute><SellerDashboard /></SellerProtectedRoute>} />
          <Route path="/seller/create-shop" element={<SellerProtectedRoute><CreateShop /></SellerProtectedRoute>} />
          <Route path="/seller/dashboard" element={<SellerProtectedRoute><SellerDashboard /></SellerProtectedRoute>} />
          <Route path="/dashboard/seller" element={<SellerProtectedRoute><SellerDashboard /></SellerProtectedRoute>} />

          {/* Writer Dashboard */}
          <Route path="/writer-dashboard" element={<WriterProtectedRoute><BlogDashboard /></WriterProtectedRoute>} />
          <Route path="/writer/blogs/:id" element={<WriterProtectedRoute><WriterBlogPreview /></WriterProtectedRoute>} />

          {/* Admin Dashboard */}
          <Route path="/admin-dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />

          {/* Profile (any authenticated user) */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
