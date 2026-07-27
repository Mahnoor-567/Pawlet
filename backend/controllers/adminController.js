const User = require('../models/User');
const Shop = require('../models/Shop');
const Blog = require('../models/Blog');
const DogListing = require('../models/DogListing');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { syncUserShopFields } = require('../utils/shopSync');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Write an audit log entry (non-blocking — errors are swallowed so they never
// prevent the primary operation from completing)
const logAudit = async (adminId, action, entityType, entityId, details = {}) => {
    try {
        await AuditLog.create({ adminId, action, entityType, entityId, details });
    } catch (err) {
        console.error('Audit log write failed:', err.message);
    }
};

// Create an in-app notification for a content creator
const createNotification = async (recipientId, type, entityType, entityId, message) => {
    try {
        await Notification.create({ recipientId, type, entityType, entityId, message });
    } catch (err) {
        console.error('Notification creation failed:', err.message);
    }
};

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────

// GET /api/admin/stats
const getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            totalSellers,
            activeListings,
            pendingShops,
            pendingListings,
            pendingBlogs,
            pendingProducts
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'seller' }),
            DogListing.countDocuments({ approvalStatus: 'approved', status: 'Available' }),
            Shop.countDocuments({ status: 'pending' }),
            DogListing.countDocuments({ approvalStatus: 'pending' }),
            Blog.countDocuments({ status: 'pending' }),
            Product.countDocuments({ approvalStatus: 'pending' })
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalSellers,
                activeListings,
                pendingShops,
                pendingListings,
                pendingBlogs,
                pendingProducts
            }
        });
    } catch (error) {
        console.error('Admin get stats error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
    }
};

// ─── USER MANAGEMENT (UC-23) ─────────────────────────────────────────────────

// GET /api/admin/users — list all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: users.length, users });
    } catch (error) {
        console.error('Admin get users error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
    }
};

// POST /api/admin/users — add a new user (admin role not permitted)
const addUser = async (req, res) => {
    try {
        const bcrypt = require('bcrypt');
        const { name, email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const normalizedRole = role && typeof role === 'string' ? role.toLowerCase() : 'user';
        if (normalizedRole === 'admin') {
            return res.status(403).json({ success: false, message: 'Admin accounts can only be created by the system.' });
        }

        const validRoles = ['user', 'seller', 'expert', 'writer'];
        if (!validRoles.includes(normalizedRole)) {
            return res.status(400).json({ success: false, message: 'Invalid role. Must be one of: user, seller, expert, writer' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name: name || '',
            email,
            password: hashedPassword,
            role: normalizedRole
        });

        await user.save();
        await logAudit(req.user.id, 'user.create', 'user', user._id, { email, role: user.role });

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error('Admin add user error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create user', error: error.message });
    }
};

// PUT /api/admin/users/:id — edit user details
const editUser = async (req, res) => {
    try {
        const { name, email, role, isActive } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const before = { name: user.name, email: user.email, role: user.role, isActive: user.isActive };

        if (role !== undefined) {
            const normalizedRole = typeof role === 'string' ? role.toLowerCase() : role;
            if (normalizedRole === 'admin' && user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Cannot assign admin role. Admin accounts are system-managed only.' });
            }
            if (user.role === 'admin' && normalizedRole !== 'admin') {
                return res.status(403).json({ success: false, message: 'Cannot change the role of an admin account.' });
            }
            if (normalizedRole !== 'admin') {
                const validRoles = ['user', 'seller', 'expert', 'writer'];
                if (!validRoles.includes(normalizedRole)) {
                    return res.status(400).json({ success: false, message: 'Invalid role. Must be one of: user, seller, expert, writer' });
                }
            }
        }

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (role !== undefined && user.role !== 'admin') user.role = role.toLowerCase();
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        await logAudit(req.user.id, 'user.edit', 'user', user._id, {
            before,
            after: { name: user.name, email: user.email, role: user.role, isActive: user.isActive }
        });

        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            user: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive }
        });
    } catch (error) {
        console.error('Admin edit user error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
    }
};

// PATCH /api/admin/users/:id/deactivate — deactivate a user
const deactivateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isActive = false;
        await user.save();

        await logAudit(req.user.id, 'user.deactivate', 'user', user._id, { email: user.email });
        await createNotification(
            user._id, 'account_updated', 'account', user._id,
            'Your account has been deactivated by an administrator. Please contact support if you believe this is an error.'
        );

        return res.status(200).json({ success: true, message: 'User deactivated successfully' });
    } catch (error) {
        console.error('Admin deactivate user error:', error);
        return res.status(500).json({ success: false, message: 'Failed to deactivate user', error: error.message });
    }
};

// PATCH /api/admin/users/:id/activate — reactivate a deactivated user
const activateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isActive = true;
        await user.save();

        await logAudit(req.user.id, 'user.activate', 'user', user._id, { email: user.email });
        await createNotification(
            user._id, 'account_updated', 'account', user._id,
            'Your account has been reactivated by an administrator. You can now log in again.'
        );

        return res.status(200).json({ success: true, message: 'User activated successfully' });
    } catch (error) {
        console.error('Admin activate user error:', error);
        return res.status(500).json({ success: false, message: 'Failed to activate user', error: error.message });
    }
};

// DELETE /api/admin/users/:id — permanently delete a user
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const snapshot = { email: user.email, role: user.role, name: user.name };
        await user.deleteOne();

        await logAudit(req.user.id, 'user.delete', 'user', req.params.id, snapshot);

        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Admin delete user error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete user', error: error.message });
    }
};

// ─── CONTENT APPROVAL (UC-24) ─────────────────────────────────────────────────

// GET /api/admin/pending — get all pending content (blogs + listings + products)
const getPendingContent = async (req, res) => {
    try {
        const blogs = await Blog.find({ status: 'pending' })
            .populate('author', 'name email')
            .sort({ createdAt: -1 });

        const listings = await DogListing.find({ approvalStatus: 'pending' })
            .populate('sellerId', 'name email shopName')
            .sort({ createdAt: -1 });

        const products = await Product.find({ approvalStatus: 'pending' })
            .populate('sellerId', 'name email shopName')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            pending: {
                blogs: { count: blogs.length, items: blogs },
                listings: { count: listings.length, items: listings },
                products: { count: products.length, items: products }
            }
        });
    } catch (error) {
        console.error('Admin get pending error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch pending content', error: error.message });
    }
};

// PATCH /api/admin/blogs/:id/approve — approve, reject, or request changes on a blog
const moderateBlog = async (req, res) => {
    try {
        const { action, feedback } = req.body;

        if (!['approved', 'rejected', 'changes_requested'].includes(action)) {
            return res.status(400).json({ success: false, message: 'action must be approved, rejected, or changes_requested' });
        }
        if ((action === 'rejected' || action === 'changes_requested') && !feedback) {
            return res.status(400).json({ success: false, message: 'feedback is required when rejecting or requesting changes' });
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        blog.status = action;
        blog.adminFeedback = feedback || '';
        await blog.save();

        await logAudit(req.user.id, `blog.${action}`, 'blog', blog._id, { title: blog.title, feedback });

        const notifMessages = {
            approved: `Your blog post "${blog.title}" has been approved and is now published.`,
            rejected: `Your blog post "${blog.title}" has been rejected. Admin feedback: ${feedback}`,
            changes_requested: `Changes requested for your blog post "${blog.title}". Instructions: ${feedback}`
        };
        if (blog.author) {
            await createNotification(blog.author, action, 'blog', blog._id, notifMessages[action]);
        }

        return res.status(200).json({ success: true, message: `Blog ${action} successfully`, blog });
    } catch (error) {
        console.error('Admin moderate blog error:', error);
        return res.status(500).json({ success: false, message: 'Failed to moderate blog', error: error.message });
    }
};

// GET /api/admin/listings — dog listing history (marketplace only)
const getListingHistory = async (req, res) => {
    try {
        const { status = 'all' } = req.query;
        const filter = {};

        if (status === 'available') {
            filter.status = 'Available';
        } else if (status === 'sold') {
            filter.status = 'Sold';
        }

        const listings = await DogListing.find(filter)
            .populate('sellerId', 'name email shopName')
            .sort({ createdAt: -1 });

        const formatted = listings.map((listing) => ({
            _id: listing._id,
            name: listing.name,
            breed: listing.breed,
            seller: listing.sellerId
                ? {
                    name: listing.sellerId.name || listing.sellerId.shopName || listing.sellerId.email,
                    email: listing.sellerId.email,
                    shopName: listing.sellerId.shopName
                }
                : null,
            status: listing.status,
            approvalStatus: listing.approvalStatus,
            createdAt: listing.createdAt,
            soldAt: listing.soldAt || (listing.status === 'Sold' ? listing.updatedAt : null)
        }));

        return res.status(200).json({
            success: true,
            count: formatted.length,
            listings: formatted,
            deletedSupported: false
        });
    } catch (error) {
        console.error('Admin get listing history error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch listing history', error: error.message });
    }
};

// PATCH /api/admin/listings/:id/approve — approve, reject, or request changes on a listing
const moderateListing = async (req, res) => {
    try {
        const { action, feedback } = req.body;

        if (!['approved', 'rejected', 'changes_requested'].includes(action)) {
            return res.status(400).json({ success: false, message: 'action must be approved, rejected, or changes_requested' });
        }
        if ((action === 'rejected' || action === 'changes_requested') && !feedback) {
            return res.status(400).json({ success: false, message: 'feedback is required when rejecting or requesting changes' });
        }

        const listing = await DogListing.findById(req.params.id);
        if (!listing) {
            return res.status(404).json({ success: false, message: 'Listing not found' });
        }

        listing.approvalStatus = action;
        listing.adminFeedback = feedback || '';
        await listing.save();

        await logAudit(req.user.id, `listing.${action}`, 'listing', listing._id, { name: listing.name, feedback });

        const notifMessages = {
            approved: `Your dog listing "${listing.name}" has been approved and is now live on the marketplace.`,
            rejected: `Your dog listing "${listing.name}" has been rejected. Admin feedback: ${feedback}`,
            changes_requested: `Changes requested for your dog listing "${listing.name}". Instructions: ${feedback}`
        };
        await createNotification(listing.sellerId, action, 'listing', listing._id, notifMessages[action]);

        return res.status(200).json({ success: true, message: `Listing ${action} successfully`, listing });
    } catch (error) {
        console.error('Admin moderate listing error:', error);
        return res.status(500).json({ success: false, message: 'Failed to moderate listing', error: error.message });
    }
};

// PATCH /api/admin/products/:id/approve — approve, reject, or request changes on a product
const moderateProduct = async (req, res) => {
    try {
        const { action, feedback } = req.body;

        if (!['approved', 'rejected', 'changes_requested'].includes(action)) {
            return res.status(400).json({ success: false, message: 'action must be approved, rejected, or changes_requested' });
        }
        if ((action === 'rejected' || action === 'changes_requested') && !feedback) {
            return res.status(400).json({ success: false, message: 'feedback is required when rejecting or requesting changes' });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.approvalStatus = action;
        product.adminFeedback = feedback || '';
        await product.save();

        await logAudit(req.user.id, `product.${action}`, 'product', product._id, { name: product.name, feedback });

        const notifMessages = {
            approved: `Your product "${product.name}" has been approved and is now available in the shop.`,
            rejected: `Your product "${product.name}" has been rejected. Admin feedback: ${feedback}`,
            changes_requested: `Changes requested for your product "${product.name}". Instructions: ${feedback}`
        };
        await createNotification(product.sellerId, action, 'product', product._id, notifMessages[action]);

        return res.status(200).json({ success: true, message: `Product ${action} successfully`, product });
    } catch (error) {
        console.error('Admin moderate product error:', error);
        return res.status(500).json({ success: false, message: 'Failed to moderate product', error: error.message });
    }
};

// PATCH /api/admin/shops/:shopId/approve — approve or reject a shop
const approveShop = async (req, res) => {
    try {
        const { action, feedback } = req.body;

        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({ success: false, message: 'action must be approved or rejected' });
        }
        if (action === 'rejected' && !feedback) {
            return res.status(400).json({ success: false, message: 'feedback is required when rejecting a shop' });
        }

        const shop = await Shop.findById(req.params.shopId);
        if (!shop) {
            return res.status(404).json({ success: false, message: 'Shop not found' });
        }
        if (shop.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Only pending shops can be moderated' });
        }

        const user = await User.findById(shop.seller);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Seller not found' });
        }

        const shopName = shop.shopName;

        shop.status = action;
        if (action === 'rejected') {
            shop.rejectionFeedback = feedback;
        } else {
            shop.rejectionFeedback = '';
        }
        await shop.save();
        await syncUserShopFields(user, shop);

        await logAudit(req.user.id, `shop.${action}`, 'shop', shop._id, { shopName, feedback });

        const notifMessages = {
            approved: `Your shop "${shopName}" has been approved! You can now publish listings and products.`,
            rejected: `Your shop application has been rejected. Admin feedback: ${feedback}`
        };
        await createNotification(user._id, action, 'shop', shop._id, notifMessages[action]);

        return res.status(200).json({
            success: true,
            message: `Shop ${action} successfully`,
            shop: {
                id: shop._id,
                shopName: shop.shopName,
                status: shop.status
            },
            shopStatus: user.shopStatus
        });
    } catch (error) {
        console.error('Admin approve shop error:', error);
        return res.status(500).json({ success: false, message: 'Failed to moderate shop', error: error.message });
    }
};

// GET /api/admin/shops/pending — list pending shops
const getPendingShops = async (req, res) => {
    try {
        const shops = await Shop.find({ status: 'pending' })
            .populate('seller', 'name email phone')
            .sort({ createdAt: -1 });

        const formatted = shops.map((shop) => ({
            _id: shop._id,
            shopName: shop.shopName,
            shopDescription: shop.description,
            logo: shop.logo,
            contactInfo: shop.contactInfo,
            phone: shop.contactInfo,
            createdAt: shop.createdAt,
            name: shop.seller?.name || '',
            email: shop.seller?.email || '',
            sellerId: shop.seller?._id
        }));

        return res.status(200).json({ success: true, count: formatted.length, shops: formatted });
    } catch (error) {
        console.error('Admin get pending shops error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch pending shops', error: error.message });
    }
};

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────

// GET /api/admin/audit
const getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * pageSize;

        const total = await AuditLog.countDocuments();
        const logs = await AuditLog.find()
            .populate('adminId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);

        return res.status(200).json({
            success: true,
            total,
            page: pageNum,
            pages: Math.ceil(total / pageSize),
            logs
        });
    } catch (error) {
        console.error('Admin get audit logs error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: error.message });
    }
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

// GET /api/admin/notifications/:userId
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipientId: req.params.userId })
            .sort({ createdAt: -1 })
            .limit(50);

        return res.status(200).json({ success: true, notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch notifications', error: error.message });
    }
};

// PATCH /api/admin/notifications/:id/read
const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        return res.status(200).json({ success: true, notification });
    } catch (error) {
        console.error('Mark notification read error:', error);
        return res.status(500).json({ success: false, message: 'Failed to mark notification as read', error: error.message });
    }
};

module.exports = {
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
};