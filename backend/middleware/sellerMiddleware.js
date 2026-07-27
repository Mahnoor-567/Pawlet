const User = require('../models/User');

const sellerMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'seller' || !user.isSeller) {
            return res.status(403).json({
                success: false,
                message: 'Only sellers can perform this action'
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Seller account must be verified before creating a shop'
            });
        }

        req.seller = user;
        next();
    } catch (error) {
        console.error('Seller middleware error:', error);
        return res.status(500).json({ success: false, message: 'Authorization check failed' });
    }
};

module.exports = sellerMiddleware;
