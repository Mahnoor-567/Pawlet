const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, default: '' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    profileImage: { type: String, default: '' },
    // Force role to one of the supported values and coerce legacy roles (e.g., buyer/admin) to user
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'seller', 'expert', 'writer', 'admin'],
        set: (value) => {
            const normalized = value ? value.toString().toLowerCase() : 'user';
            if (['seller', 'expert', 'writer', 'admin'].includes(normalized)) {
                return normalized;
            }
            return 'user';
        }
    },
    isVerified: { type: Boolean, default: false },
    isSeller: { type: Boolean, default: false },
    sellerType: { type: String, enum: ['business', 'individual'], default: 'business' },
    isActive: { type: Boolean, default: true },
    shopName: { type: String, default: '' },
    shopDescription: { type: String, default: '' },
    shopStatus: { type: String, default: 'inactive', enum: ['inactive', 'pending', 'active', 'rejected', 'suspended'] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);