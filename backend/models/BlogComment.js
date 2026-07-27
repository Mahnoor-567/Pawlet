const mongoose = require('mongoose');

const blogCommentSchema = new mongoose.Schema(
    {
        blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true, trim: true }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('BlogComment', blogCommentSchema);
