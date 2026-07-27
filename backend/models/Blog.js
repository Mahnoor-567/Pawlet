const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, unique: true, trim: true },
        content: { type: String, default: '' },
        images: [{ type: String }],
        tags: [{ type: String }],
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: {
            type: String,
            default: 'pending',
            enum: ['draft', 'pending', 'approved', 'rejected', 'changes_requested']
        },
        adminFeedback: { type: String, default: '' }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Blog', blogSchema);