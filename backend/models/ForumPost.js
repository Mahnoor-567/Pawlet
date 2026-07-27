const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        category: { type: String, required: true },
        tags: [{ type: String }],
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        isPinned: { type: Boolean, default: false },
        isExpertPost: { type: Boolean, default: false },
        likes: { type: Number, default: 0 },
        repliesCount: { type: Number, default: 0 }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('ForumPost', forumPostSchema);