const mongoose = require('mongoose');

const dogListingSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    breed: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female'] },
    age: { type: Number, required: true },
    price: { type: Number, required: true },
    location: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    healthStatus: { type: String, required: true, enum: ['Healthy', 'Vaccinated', 'Neutered/Spayed', 'Under Treatment'] },
    images: [{ type: String, required: true }],
    status: { type: String, default: 'Available', enum: ['Available', 'Sold', 'Unlisted'] },
    soldAt: { type: Date, default: null },
    approvalStatus: {
        type: String,
        default: 'pending',
        enum: ['pending', 'approved', 'rejected', 'changes_requested']
    },
    adminFeedback: { type: String, default: '' },
    description: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DogListing', dogListingSchema);