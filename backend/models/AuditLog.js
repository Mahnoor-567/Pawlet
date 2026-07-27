const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        action: {
            type: String,
            required: true,
            enum: [
                'user.create', 'user.edit', 'user.deactivate', 'user.activate', 'user.delete',
                'blog.approved', 'blog.rejected', 'blog.changes_requested',
                'listing.approved', 'listing.rejected', 'listing.changes_requested',
                'product.approved', 'product.rejected', 'product.changes_requested',
                'shop.approved', 'shop.rejected'
            ]
        },
        entityType: {
            type: String,
            required: true,
            enum: ['user', 'blog', 'listing', 'product', 'shop']
        },
        entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
        details: { type: mongoose.Schema.Types.Mixed, default: {} }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
