const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const authMiddleware = require('../middleware/authMiddleware');
const {
    getStats,
    getAllUsers,
    addUser,
    editUser,
    deactivateUser,
    activateUser,
    deleteUser,
    getPendingContent,
    getPendingShops,
    getListingHistory,
    moderateBlog,
    moderateListing,
    moderateProduct,
    approveShop,
    getAuditLogs,
    getNotifications,
    markNotificationRead
} = require('../controllers/adminController');

// Notifications — any authenticated user can access their own
router.get('/notifications/:userId', authMiddleware, getNotifications);
router.patch('/notifications/:id/read', authMiddleware, markNotificationRead);

// All routes below require admin role
router.use(adminMiddleware);

// ── Dashboard Stats ───────────────────────────────────
router.get('/stats', getStats);

// ── User Management (UC-23) ───────────────────────────
router.get('/users', getAllUsers);
router.post('/users', addUser);
router.put('/users/:id', editUser);
router.patch('/users/:id/deactivate', deactivateUser);
router.patch('/users/:id/activate', activateUser);
router.delete('/users/:id', deleteUser);

// ── Content Approval (UC-24) ──────────────────────────
router.get('/pending', getPendingContent);
router.get('/listings', getListingHistory);
router.patch('/blogs/:id/approve', moderateBlog);
router.patch('/listings/:id/approve', moderateListing);
router.patch('/products/:id/approve', moderateProduct);

// ── Shop Approval ─────────────────────────────────────
router.get('/shops/pending', getPendingShops);
router.patch('/shops/:shopId/approve', approveShop);

// ── Audit Log ─────────────────────────────────────────
router.get('/audit', getAuditLogs);

module.exports = router;