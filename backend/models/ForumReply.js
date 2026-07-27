const mongoose = require('mongoose');

const forumReplySchema = new mongoose.Schema(
    {
        postId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumPost', required: true },
        content: { type: String, required: true },
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        isExpertAnswer: { type: Boolean, default: false }
    },
    {
        timestamps: { createdAt: true, updatedAt: false }
    }
);

module.exports = mongoose.model('ForumReply', forumReplySchema);
