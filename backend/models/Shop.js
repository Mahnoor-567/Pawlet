const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    shopName: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    logo: { type: String, default: '' },
    contactInfo: { type: String, required: true, trim: true },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionFeedback: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

shopSchema.index({ shopName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

shopSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Shop', shopSchema);
