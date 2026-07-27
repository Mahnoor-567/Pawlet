const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getAllBlogs,
  getMyBlogs,
  getBlogById,
  getWriterBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogComments,
  addBlogComment
} = require('../controllers/blogController');

const writerOnly = (req, res, next) => {
  const isWriter = req.user && (req.user.role === 'writer' || req.user.isWriter === true);
  if (!isWriter) {
    return res.status(403).json({
      success: false,
      message: 'Only blog writers can perform this action'
    });
  }
  return next();
};

// Public routes — approved blogs only
router.get('/', getAllBlogs);

// Writer routes — must be registered before /:id
router.get('/mine', authMiddleware, writerOnly, getMyBlogs);
router.get('/writer/:id', authMiddleware, writerOnly, getWriterBlogById);

router.post('/', authMiddleware, writerOnly, createBlog);
router.put('/:id', authMiddleware, writerOnly, updateBlog);
router.delete('/:id', authMiddleware, writerOnly, deleteBlog);

// Comment routes — must be registered before /:id
router.get('/:id/comments', getBlogComments);
router.post('/:id/comments', authMiddleware, addBlogComment);

// Public single blog — approved only
router.get('/:id', getBlogById);

module.exports = router;
