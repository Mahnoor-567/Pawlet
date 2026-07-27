const mongoose = require('mongoose');

const PRODUCT_CATEGORIES = [
  'Food',
  'Toys',
  'Accessories',
  'Grooming',
  'Health',
  'Beds',
  'Other'
];

const productSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: {
        type: String,
        default: 'Other',
        trim: true,
        enum: PRODUCT_CATEGORIES
    },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    image: { type: String, default: '' },
    approvalStatus: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected', 'changes_requested']
    },
    adminFeedback: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

productSchema.statics.CATEGORIES = PRODUCT_CATEGORIES;

module.exports = mongoose.model('Product', productSchema);
