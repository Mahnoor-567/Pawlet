const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const {
    getForumPosts,
    getForumPostById,
    createForumPost,
    createForumReply,
    updateForumReply
} = require('../controllers/forumController');

const router = express.Router();

router.get('/posts', getForumPosts);
router.get('/posts/:id', getForumPostById);
router.post('/posts', authMiddleware, createForumPost);
router.post('/posts/:id/replies', authMiddleware, createForumReply);
router.put('/posts/:id/replies/:replyId', authMiddleware, updateForumReply);

module.exports = router;
