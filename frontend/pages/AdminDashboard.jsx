import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api/admin';

const TABS = [
  { id: 'overview', label: 'Dashboard Overview' },
  { id: 'users', label: 'User Management' },
  { id: 'moderation', label: 'Content Moderation' },
  { id: 'listings', label: 'Listing History' },
  { id: 'shops', label: 'PawMart Approval' },
  { id: 'audit', label: 'Audit Logs' }
];

const STAT_CARDS = [
  { key: 'totalUsers', label: 'Total Users', color: 'bg-blue-50 text-blue-700' },
  { key: 'totalSellers', label: 'Total Sellers', color: 'bg-purple-50 text-purple-700' },
  { key: 'activeListings', label: 'Active Listings', color: 'bg-green-50 text-green-700' },
  { key: 'pendingShops', label: 'Pending PawMarts', color: 'bg-yellow-50 text-yellow-700' },
  { key: 'pendingListings', label: 'Pending Listings', color: 'bg-orange-50 text-orange-700' },
  { key: 'pendingBlogs', label: 'Pending Blogs', color: 'bg-pink-50 text-pink-700' },
  { key: 'pendingProducts', label: 'Pending Products', color: 'bg-indigo-50 text-indigo-700' }
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const authToken = token || localStorage.getItem('authToken');

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [pendingContent, setPendingContent] = useState({ blogs: [], listings: [], products: [] });
  const [pendingShops, setPendingShops] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPages, setAuditPages] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [listingHistory, setListingHistory] = useState([]);
  const [listingFilter, setListingFilter] = useState('all');
  const [deletedListingsSupported, setDeletedListingsSupported] = useState(false);

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'user' });

  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');

  const headers = {
    Authorization: `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  const apiFetch = useCallback(async (url, options = {}) => {
    const response = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  }, [authToken]);

  const loadStats = async () => {
    const data = await apiFetch(`${API_BASE}/stats`);
    setStats(data.stats || {});
  };

  const loadUsers = async () => {
    const data = await apiFetch(`${API_BASE}/users`);
    setUsers(data.users || []);
  };

  const loadPendingContent = async () => {
    const data = await apiFetch(`${API_BASE}/pending`);
    const pending = data.pending || {};
    setPendingContent({
      blogs: pending.blogs?.items || [],
      listings: pending.listings?.items || [],
      products: pending.products?.items || []
    });
  };

  const loadPendingShops = async () => {
    const data = await apiFetch(`${API_BASE}/shops/pending`);
    setPendingShops(data.shops || []);
  };

  const loadAuditLogs = async (page = 1) => {
    const data = await apiFetch(`${API_BASE}/audit?page=${page}&limit=20`);
    setAuditLogs(data.logs || []);
    setAuditPage(data.page || 1);
    setAuditPages(data.pages || 1);
    setAuditTotal(data.total || 0);
  };

  const loadListingHistory = async (status = 'all') => {
    const data = await apiFetch(`${API_BASE}/listings?status=${status}`);
    setListingHistory(data.listings || []);
    setDeletedListingsSupported(data.deletedSupported === true);
  };

  const loadTabData = useCallback(async (tab) => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'overview') await loadStats();
      else if (tab === 'users') await loadUsers();
      else if (tab === 'moderation') await loadPendingContent();
      else if (tab === 'listings') await loadListingHistory(listingFilter);
      else if (tab === 'shops') await loadPendingShops();
      else if (tab === 'audit') await loadAuditLogs(auditPage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authToken, auditPage, listingFilter]);

  useEffect(() => {
    if (!authToken) {
      navigate('/login');
      return;
    }
    loadTabData(activeTab);
  }, [authToken, activeTab, navigate]);

  useEffect(() => {
    if (activeTab === 'audit') loadAuditLogs(auditPage);
  }, [auditPage]);

  useEffect(() => {
    if (activeTab === 'listings') loadListingHistory(listingFilter);
  }, [listingFilter, activeTab]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setUserForm({ name: user.name || '', email: user.email, password: '', role: user.role });
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    try {
      const payload = { name: userForm.name, email: userForm.email };
      if (editingUser.role !== 'admin') {
        payload.role = userForm.role;
      }
      await apiFetch(`${API_BASE}/users/${editingUser._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showSuccess('User updated successfully');
      setShowUserModal(false);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      await apiFetch(`${API_BASE}/users/${userId}/activate`, { method: 'PATCH' });
      showSuccess('User activated');
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await apiFetch(`${API_BASE}/users/${userId}/deactivate`, { method: 'PATCH' });
      showSuccess('User deactivated');
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    try {
      await apiFetch(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
      showSuccess('User deleted');
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleModerate = async (type, id, action) => {
    if ((action === 'rejected' || action === 'changes_requested') && !feedbackText.trim()) {
      setError('Feedback is required for reject or request changes');
      return;
    }
    const endpoints = {
      blog: `${API_BASE}/blogs/${id}/approve`,
      listing: `${API_BASE}/listings/${id}/approve`,
      product: `${API_BASE}/products/${id}/approve`
    };
    try {
      await apiFetch(endpoints[type], {
        method: 'PATCH',
        body: JSON.stringify({ action, feedback: feedbackText })
      });
      showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} ${action.replace('_', ' ')}`);
      setFeedbackModal(null);
      setFeedbackText('');
      await loadPendingContent();
      if (activeTab === 'overview') await loadStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShopAction = async (shopId, action) => {
    if (action === 'rejected' && !feedbackText.trim()) {
      setError('Feedback is required when rejecting a shop');
      return;
    }
    try {
      await apiFetch(`${API_BASE}/shops/${shopId}/approve`, {
        method: 'PATCH',
        body: JSON.stringify({ action, feedback: feedbackText })
      });
      showSuccess(`PawMart ${action}`);
      setFeedbackModal(null);
      setFeedbackText('');
      await loadPendingShops();
      if (activeTab === 'overview') await loadStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const openFeedbackModal = (config) => {
    setFeedbackModal(config);
    setFeedbackText('');
    setError('');
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {STAT_CARDS.map(({ key, label, color }) => (
        <div key={key} className={`rounded-xl p-5 shadow-sm border border-gray-100 ${color}`}>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-3xl font-bold mt-1">{stats[key] ?? 0}</p>
        </div>
      ))}
    </div>
  );

  const renderUsers = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">All Users ({users.length})</h2>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{u.name || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => openEditUser(u)} className="text-sm text-blue-600 hover:text-blue-800">Edit</button>
                  {u.isActive !== false ? (
                    <button onClick={() => handleDeactivateUser(u._id)} className="text-sm text-yellow-600 hover:text-yellow-800">Deactivate</button>
                  ) : (
                    <button onClick={() => handleActivateUser(u._id)} className="text-sm text-green-600 hover:text-green-800">Activate</button>
                  )}
                  <button onClick={() => handleDeleteUser(u._id)} className="text-sm text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderModerationSection = (title, items, type, nameField) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">{title} ({items.length})</h3>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">No pending {title.toLowerCase()}.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
              <div>
                <p className="font-medium text-gray-900">{item[nameField]}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {type === 'blog' && item.author && `By: ${item.author.name || item.author.email}`}
                  {(type === 'listing' || type === 'product') && item.sellerId && `Seller: ${item.sellerId.name || item.sellerId.shopName || item.sellerId.email}`}
                </p>
                {item.content && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.content}</p>}
                {item.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>}
              </div>
              <div className="flex gap-2 mt-3 sm:mt-0">
                <button
                  onClick={() => handleModerate(type, item._id, 'approved')}
                  className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => openFeedbackModal({ type, id: item._id, action: 'rejected', label: `Reject ${item[nameField]}` })}
                  className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Reject
                </button>
                <button
                  onClick={() => openFeedbackModal({ type, id: item._id, action: 'changes_requested', label: `Request Changes for ${item[nameField]}` })}
                  className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                >
                  Request Changes
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderModeration = () => (
    <div>
      {renderModerationSection('Pending Blogs', pendingContent.blogs, 'blog', 'title')}
      {renderModerationSection('Pending Listings', pendingContent.listings, 'listing', 'name')}
      {renderModerationSection('Pending Products', pendingContent.products, 'product', 'name')}
    </div>
  );

  const renderShops = () => (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending PawMarts ({pendingShops.length})</h2>
      {pendingShops.length === 0 ? (
        <p className="text-gray-500">No PawMarts awaiting approval.</p>
      ) : (
        <div className="space-y-4">
          {pendingShops.map((shop) => (
            <div key={shop._id} className="p-5 bg-white border border-gray-200 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex gap-4">
                  {shop.logo ? (
                    <img src={shop.logo} alt={shop.shopName} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">🏪</div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{shop.shopName}</h3>
                    <p className="text-sm text-gray-600 mt-1">Owner: {shop.name} ({shop.email})</p>
                    {(shop.contactInfo || shop.phone) && (
                      <p className="text-sm text-gray-600">Contact: {shop.contactInfo || shop.phone}</p>
                    )}
                    {shop.shopDescription && <p className="text-sm text-gray-600 mt-2">{shop.shopDescription}</p>}
                    <p className="text-xs text-gray-400 mt-2">Submitted: {new Date(shop.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShopAction(shop._id, 'approved')}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => openFeedbackModal({ type: 'shop', id: shop._id, action: 'rejected', label: `Reject ${shop.shopName}` })}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const formatApprovalStatus = (status) => {
    if (!status) return '—';
    if (status === 'approved') return 'Approved';
    if (status === 'rejected') return 'Rejected';
    if (status === 'pending') return 'Pending';
    if (status === 'changes_requested') return 'Changes Requested';
    return status;
  };

  const getApprovalStatusColor = (status) => {
    if (status === 'approved') return 'bg-green-100 text-green-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    if (status === 'pending' || status === 'changes_requested') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const renderListingHistory = () => (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Dog Listing History ({listingHistory.length})</h2>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'available', label: 'Available' },
            { value: 'sold', label: 'Sold' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setListingFilter(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                listingFilter === value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!deletedListingsSupported && (
        <p className="text-sm text-gray-500 mb-4">
          Deleted listings are permanently removed and are not shown in history.
        </p>
      )}

      {listingHistory.length === 0 ? (
        <p className="text-gray-500">No dog listings found for this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dog Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Breed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sold Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {listingHistory.map((listing) => (
                <tr key={listing._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{listing.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{listing.breed}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {listing.seller?.name || '—'}
                    {listing.seller?.email && (
                      <span className="block text-xs text-gray-400">{listing.seller.email}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      listing.status === 'Sold'
                        ? 'bg-red-100 text-red-700'
                        : listing.status === 'Available'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getApprovalStatusColor(listing.approvalStatus)}`}>
                      {formatApprovalStatus(listing.approvalStatus)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {listing.soldAt ? new Date(listing.soldAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderAudit = () => (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Audit Logs ({auditTotal})</h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auditLogs.map((log) => (
              <tr key={log._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {log.adminId?.name || log.adminId?.email || '—'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">{log.action}</span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{log.entityType}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                  {log.details ? JSON.stringify(log.details) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {auditPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
            disabled={auditPage <= 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {auditPage} of {auditPages}</span>
          <button
            onClick={() => setAuditPage((p) => Math.min(auditPages, p + 1))}
            disabled={auditPage >= auditPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage users, content, shops, and audit logs</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg text-sm">{success}</div>
        )}

        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'moderation' && renderModeration()}
              {activeTab === 'listings' && renderListingHistory()}
              {activeTab === 'shops' && renderShops()}
              {activeTab === 'audit' && renderAudit()}
            </>
          )}
        </div>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              {!editingUser?.role || editingUser.role === 'admin' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <p className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm">
                    {editingUser?.role || 'admin'} (system-managed)
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="user">User</option>
                    <option value="seller">Seller</option>
                    <option value="expert">Expert</option>
                    <option value="writer">Writer</option>
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {feedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{feedbackModal.label}</h3>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
              placeholder="Enter feedback for the creator..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (feedbackModal.type === 'shop') {
                    handleShopAction(feedbackModal.id, feedbackModal.action);
                  } else {
                    handleModerate(feedbackModal.type, feedbackModal.id, feedbackModal.action);
                  }
                }}
                className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Submit
              </button>
              <button
                onClick={() => { setFeedbackModal(null); setFeedbackText(''); }}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
