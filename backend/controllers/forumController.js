const ForumPost = require('../models/ForumPost');
const ForumReply = require('../models/ForumReply');

const normalizeStringArray = (values) => {
    if (!Array.isArray(values)) {
        return [];
    }
    return values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter((value) => value);
};

const getForumPosts = async (_req, res) => {
    try {
        const posts = await ForumPost.find()
            .populate('author', 'name email')
            .sort({ isPinned: -1, createdAt: -1 });

        if (posts.length === 0) {
            return res.status(200).json({ success: true, posts: [] });
        }

        const postIds = posts.map((post) => post._id);
        const replyCounts = await ForumReply.aggregate([
            { $match: { postId: { $in: postIds } } },
            {
                $group: {
                    _id: '$postId',
                    count: { $sum: 1 },
                    expertCount: { $sum: { $cond: ['$isExpertAnswer', 1, 0] } }
                }
            }
        ]);

        const replyCountMap = replyCounts.reduce(
            (acc, item) => {
                acc[item._id.toString()] = {
                    count: item.count,
                    expertCount: item.expertCount
                };
                return acc;
            },
            {}
        );

        const formatted = posts.map((post) => {
            const data = post.toObject();
            return {
                ...data,
                replyCount: replyCountMap[post._id.toString()]?.count || 0,
                expertVerified: (replyCountMap[post._id.toString()]?.expertCount || 0) > 0
            };
        });

        return res.status(200).json({ success: true, posts: formatted });
    } catch (error) {
        console.error('Fetch forum posts error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch forum posts', error: error.message });
    }
};

const getForumPostById = async (req, res) => {
    try {
        const post = await ForumPost.findById(req.params.id).populate('author', 'name email');
        if (!post) {
            return res.status(404).json({ success: false, message: 'Forum post not found' });
        }

        const replies = await ForumReply.find({ postId: post._id })
            .populate('author', 'name email')
            .sort({ createdAt: 1 });

        return res.status(200).json({
            success: true,
            post,
            replies
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: 'Forum post not found' });
        }
        console.error('Fetch forum post error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch forum post', error: error.message });
    }
};

const createForumPost = async (req, res) => {
    try {
        const { title, content, category, tags } = req.body;
        const trimmedTitle = typeof title === 'string' ? title.trim() : '';
        const trimmedContent = typeof content === 'string' ? content.trim() : '';
        const trimmedCategory = typeof category === 'string' ? category.trim() : '';

        if (!trimmedTitle) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }

        if (!trimmedContent) {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }

        // Guard: author must exist (authMiddleware should ensure this)
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: 'You must be logged in to post' });
        }

        const post = new ForumPost({
            title: trimmedTitle,
            content: trimmedContent,
            category: trimmedCategory || 'General',
            tags: normalizeStringArray(tags),
            author: req.user.id
        });

        const saved = await post.save();
        const populated = await ForumPost.findById(saved._id).populate('author', 'name email');

        return res.status(201).json({
            success: true,
            message: 'Forum post created successfully',
            post: populated
        });
    } catch (error) {
        console.error('Create forum post error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create forum post', error: error.message });
    }
};

const createForumReply = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: 'You must be logged in to reply' });
        }

        const { content } = req.body;
        const trimmedContent = typeof content === 'string' ? content.trim() : '';

        if (!trimmedContent) {
            return res.status(400).json({ success: false, message: 'Reply cannot be empty' });
        }

        const post = await ForumPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Forum post not found' });
        }

        const isExpertAnswer = req.user.role === 'expert';

        const reply = new ForumReply({
            postId: post._id,
            content: trimmedContent,
            author: req.user.id,
            isExpertAnswer
        });

        const saved = await reply.save();
        await ForumPost.findByIdAndUpdate(post._id, { $inc: { repliesCount: 1 } });
        const populated = await ForumReply.findById(saved._id).populate('author', 'name email');

        return res.status(201).json({
            success: true,
            message: 'Reply added successfully',
            reply: populated
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: 'Forum post not found' });
        }
        console.error('Create forum reply error:', error);
        return res.status(500).json({ success: false, message: 'Failed to create reply', error: error.message });
    }
};

const getAuthorId = (author) => {
    if (!author) return null;
    if (typeof author === 'object' && author._id) return String(author._id);
    return String(author);
};

const updateForumReply = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, message: 'You must be logged in to edit a reply' });
        }

        if (req.user.role !== 'expert') {
            return res.status(403).json({ success: false, message: 'Only experts can edit replies' });
        }

        const { content } = req.body;
        const trimmedContent = typeof content === 'string' ? content.trim() : '';

        if (!trimmedContent) {
            return res.status(400).json({ success: false, message: 'Reply cannot be empty' });
        }

        const post = await ForumPost.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Forum post not found' });
        }

        const reply = await ForumReply.findOne({ _id: req.params.replyId, postId: post._id });
        if (!reply) {
            return res.status(404).json({ success: false, message: 'Reply not found' });
        }

        if (getAuthorId(reply.author) !== String(req.user.id)) {
            return res.status(403).json({ success: false, message: 'You can only edit your own replies' });
        }

        reply.content = trimmedContent;
        const saved = await reply.save();
        const populated = await ForumReply.findById(saved._id).populate('author', 'name email');

        return res.status(200).json({
            success: true,
            message: 'Reply updated successfully',
            reply: populated
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: 'Reply not found' });
        }
        console.error('Update forum reply error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update reply', error: error.message });
    }
};

module.exports = {
    getForumPosts,
    getForumPostById,
    createForumPost,
    createForumReply,
    updateForumReply
};