const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        type: {
            type: String,
            required: true,
            enum: ['approved', 'rejected', 'changes_requested', 'account_updated']
        },
        entityType: {
            type: String,
            required: true,
            enum: ['blog', 'listing', 'product', 'shop', 'account']
        },
        entityId: { type: mongoose.Schema.Types.ObjectId },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

module.exports = mongoose.model('Notification', notificationSchema);
