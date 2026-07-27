const Shop = require('../models/Shop');
const User = require('../models/User');
const { syncUserShopFields, escapeRegex } = require('../utils/shopSync');

const formatShopResponse = (shop) => ({
    id: shop._id,
    shopName: shop.shopName,
    description: shop.description,
    logo: shop.logo,
    contactInfo: shop.contactInfo,
    status: shop.status,
    seller: shop.seller,
    rejectionFeedback: shop.rejectionFeedback || '',
    createdAt: shop.createdAt,
    updatedAt: shop.updatedAt
});

const formatUserShopSummary = (user, shop) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isSeller: user.isSeller,
    isVerified: user.isVerified,
    shopName: user.shopName,
    shopStatus: user.shopStatus,
    phone: user.phone,
    shop: shop ? formatShopResponse(shop) : null
});

// POST /api/shops — create a new shop (verified seller only)
const createShop = async (req, res) => {
    try {
        const seller = req.seller;
        const { shopName, description, logo, contactInfo } = req.body;

        const trimmedName = typeof shopName === 'string' ? shopName.trim() : '';
        const trimmedDescription = typeof description === 'string' ? description.trim() : '';
        const trimmedContact = typeof contactInfo === 'string' ? contactInfo.trim() : '';
        const trimmedLogo = typeof logo === 'string' ? logo.trim() : '';

        if (!trimmedName) {
            return res.status(400).json({ success: false, message: 'Shop name is required' });
        }
        if (trimmedName.length < 2 || trimmedName.length > 80) {
            return res.status(400).json({
                success: false,
                message: 'Shop name must be between 2 and 80 characters'
            });
        }
        if (!trimmedDescription) {
            return res.status(400).json({ success: false, message: 'Description is required' });
        }
        if (!trimmedContact) {
            return res.status(400).json({ success: false, message: 'Contact information is required' });
        }

        const existingBySeller = await Shop.findOne({ seller: seller._id });
        if (existingBySeller) {
            if (existingBySeller.status === 'rejected') {
                const duplicateName = await Shop.findOne({
                    shopName: { $regex: `^${escapeRegex(trimmedName)}$`, $options: 'i' },
                    _id: { $ne: existingBySeller._id }
                });
                if (duplicateName) {
                    return res.status(400).json({
                        success: false,
                        message: 'Shop name is already taken'
                    });
                }

                existingBySeller.shopName = trimmedName;
                existingBySeller.description = trimmedDescription;
                existingBySeller.logo = trimmedLogo;
                existingBySeller.contactInfo = trimmedContact;
                existingBySeller.status = 'pending';
                existingBySeller.rejectionFeedback = '';
                await existingBySeller.save();
                await syncUserShopFields(seller, existingBySeller);

                return res.status(200).json({
                    success: true,
                    message: 'Shop resubmitted for admin approval.',
                    shop: formatShopResponse(existingBySeller),
                    user: formatUserShopSummary(seller, existingBySeller)
                });
            }

            return res.status(400).json({
                success: false,
                message: 'You already have a shop associated with this account'
            });
        }

        const existingByName = await Shop.findOne({
            shopName: { $regex: `^${escapeRegex(trimmedName)}$`, $options: 'i' }
        });
        if (existingByName) {
            return res.status(400).json({
                success: false,
                message: 'Shop name is already taken'
            });
        }

        const shop = await Shop.create({
            shopName: trimmedName,
            description: trimmedDescription,
            logo: trimmedLogo,
            contactInfo: trimmedContact,
            seller: seller._id,
            status: 'pending'
        });

        await syncUserShopFields(seller, shop);

        return res.status(201).json({
            success: true,
            message: 'Shop submitted for admin approval. You will be notified once approved.',
            shop: formatShopResponse(shop),
            user: formatUserShopSummary(seller, shop)
        });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern || {})[0];
            const message = field === 'seller'
                ? 'You already have a shop associated with this account'
                : 'Shop name is already taken';
            return res.status(400).json({ success: false, message });
        }
        console.error('Create shop error:', error);
        return res.status(500).json({ success: false, message: 'Error creating shop', error: error.message });
    }
};

// GET /api/shops/mine — get the authenticated seller's shop
const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ seller: req.seller._id });
        if (!shop) {
            return res.status(200).json({ success: true, shop: null });
        }
        return res.status(200).json({
            success: true,
            shop: formatShopResponse(shop)
        });
    } catch (error) {
        console.error('Get my shop error:', error);
        return res.status(500).json({ success: false, message: 'Error fetching shop', error: error.message });
    }
};

module.exports = { createShop, getMyShop };
