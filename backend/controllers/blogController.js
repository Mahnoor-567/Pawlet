const Blog = require('../models/Blog');
const BlogComment = require('../models/BlogComment');

const validImageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) return [];
    return tags.map((tag) => (typeof tag === 'string' ? tag.trim() : '')).filter((tag) => tag);
};

const normalizeImages = (images) => {
    if (!Array.isArray(images)) return [];
    return images.map((image) => (typeof image === 'string' ? image.trim() : '')).filter((image) => image);
};

const validateImages = (images) => {
    if (!images.length) return { valid: true };

    const isValid = images.every((image) => {
        if (typeof image !== 'string') return false;

        if (image.startsWith('http://') || image.startsWith('https://')) {
            return true;
        }

        if (image.startsWith('data:image/')) {
            const format = image.split(';')[0].split('/')[1];
            return validImageFormats.includes(format);
        }

        const ext = image.split('.').pop().toLowerCase();
        return validImageFormats.includes(ext);
    });

    return {
        valid: isValid,
        message: `Invalid image format. Supported formats: ${validImageFormats.join(', ')}`
    };
};

const findDuplicateTitle = async (title, excludeId = null) => {
    const filter = { title: { $regex: `^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } };
    if (excludeId) {
        filter._id = { $ne: excludeId };
    }
    return Blog.findOne(filter);
};

const formatStatusLabel = (status) => {
    if (status === 'changes_requested') return 'Changes Requested';
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
};

const getAuthorId = (author) => {
    if (!author) return null;
    if (typeof author === 'object' && author._id) return String(author._id);
    return String(author);
};

const validateBlogFields = (trimmedTitle, trimmedContent, normalizedTags, normalizedImages, isDraft) => {
    if (!trimmedTitle) {
        return { valid: false, message: 'Title is required' };
    }

    if (isDraft) {
        if (normalizedImages.length > 0) {
            const imageValidation = validateImages(normalizedImages);
            if (!imageValidation.valid) {
                return { valid: false, message: imageValidation.message };
            }
        }
        return { valid: true };
    }

    if (!trimmedContent) {
        return { valid: false, message: 'Content is required' };
    }

    if (normalizedTags.length === 0) {
        return { valid: false, message: 'At least one tag is required' };
    }

    const imageValidation = validateImages(normalizedImages);
    if (!imageValidation.valid) {
        return { valid: false, message: imageValidation.message };
    }

    return { valid: true };
};

const createBlog = async (req, res) => {
    try {
        const { title, content, tags, images, status: requestedStatus } = req.body;

        if (!req.user || (req.user.role !== 'writer' && req.user.isWriter !== true)) {
            return res.status(403).json({
                success: false,
                message: 'Only blog writers can create blogs'
            });
        }

        const isDraft = requestedStatus === 'draft';
        const trimmedTitle = typeof title === 'string' ? title.trim() : '';
        const trimmedContent = typeof content === 'string' ? content.trim() : '';
        const normalizedTags = normalizeTags(tags);
        const normalizedImages = normalizeImages(images);

        const fieldValidation = validateBlogFields(
            trimmedTitle,
            trimmedContent,
            normalizedTags,
            normalizedImages,
            isDraft
        );
        if (!fieldValidation.valid) {
            return res.status(400).json({ success: false, message: fieldValidation.message });
        }

        const duplicate = await findDuplicateTitle(trimmedTitle);
        if (duplicate) {
            return res.status(400).json({ success: false, message: 'Blog title must be unique across the system' });
        }

        const blog = new Blog({
            title: trimmedTitle,
            content: trimmedContent,
            tags: normalizedTags,
            images: normalizedImages,
            author: req.user.id,
            status: isDraft ? 'draft' : 'pending'
        });

        const saved = await blog.save();
        const populated = await Blog.findById(saved._id).populate('author', 'name email');

        const message = isDraft
            ? 'Blog saved as draft.'
            : 'Blog submitted for admin approval.';

        return res.status(201).json({
            success: true,
            message,
            blog: populated
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Blog title must be unique across the system' });
        }
        console.error('Create blog error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create blog',
            error: error.message
        });
    }
};

const getAllBlogs = async (_req, res) => {
    try {
        const blogs = await Blog.find({ status: 'approved' })
            .populate('author', 'name')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: 'Blogs retrieved successfully',
            blogs
        });
    } catch (error) {
        console.error('Fetch blogs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch blogs',
            error: error.message
        });
    }
};

const getMyBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ author: req.user.id })
            .populate('author', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: blogs.length,
            blogs
        });
    } catch (error) {
        console.error('Fetch my blogs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch your blogs',
            error: error.message
        });
    }
};

const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author', 'name email');

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        if (blog.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'This blog is pending admin approval'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Blog retrieved successfully',
            blog
        });
    } catch (error) {
        console.error('Fetch blog error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch blog',
            error: error.message
        });
    }
};

const getWriterBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author', 'name email');

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        if (getAuthorId(blog.author) !== String(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You can only view your own blogs'
            });
        }

        return res.status(200).json({
            success: true,
            blog
        });
    } catch (error) {
        console.error('Fetch writer blog error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch blog',
            error: error.message
        });
    }
};

const updateBlog = async (req, res) => {
    try {
        const { title, content, tags, images, status: requestedStatus } = req.body;

        if (!req.user || (req.user.role !== 'writer' && req.user.isWriter !== true)) {
            return res.status(403).json({
                success: false,
                message: 'Only blog writers can update blogs'
            });
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        if (getAuthorId(blog.author) !== String(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own blog'
            });
        }

        const previousStatus = blog.status;
        const savingAsDraft = previousStatus === 'draft' && requestedStatus !== 'pending';
        const submittingDraft = previousStatus === 'draft' && requestedStatus === 'pending';

        const trimmedTitle = typeof title === 'string' ? title.trim() : '';
        const trimmedContent = typeof content === 'string' ? content.trim() : '';
        const normalizedTags = normalizeTags(tags);
        const normalizedImages = normalizeImages(images);

        const fieldValidation = validateBlogFields(
            trimmedTitle,
            trimmedContent,
            normalizedTags,
            normalizedImages,
            savingAsDraft
        );
        if (!fieldValidation.valid) {
            return res.status(400).json({ success: false, message: fieldValidation.message });
        }

        const duplicate = await findDuplicateTitle(trimmedTitle, blog._id);
        if (duplicate) {
            return res.status(400).json({ success: false, message: 'Blog title must be unique across the system' });
        }

        blog.title = trimmedTitle;
        blog.content = trimmedContent;
        blog.tags = normalizedTags;
        blog.images = normalizedImages;

        if (submittingDraft) {
            blog.status = 'pending';
            blog.adminFeedback = '';
        } else if (savingAsDraft) {
            blog.status = 'draft';
        } else if (['approved', 'rejected', 'changes_requested'].includes(previousStatus)) {
            blog.status = 'pending';
            blog.adminFeedback = '';
        }

        const updated = await blog.save();
        const populated = await Blog.findById(updated._id).populate('author', 'name email');

        let message;
        if (submittingDraft) {
            message = 'Draft submitted for admin approval.';
        } else if (savingAsDraft) {
            message = 'Draft saved successfully.';
        } else if (previousStatus === 'approved') {
            message = 'Blog updated successfully. Status changed to Pending for admin review.';
        } else if (previousStatus === 'pending') {
            message = 'Blog updated successfully. Status remains Pending.';
        } else {
            message = 'Blog updated successfully and resubmitted for approval.';
        }

        return res.status(200).json({
            success: true,
            message,
            blog: populated
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Blog title must be unique across the system' });
        }
        console.error('Update blog error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update blog',
            error: error.message
        });
    }
};

const deleteBlog = async (req, res) => {
    try {
        if (!req.user || (req.user.role !== 'writer' && req.user.isWriter !== true)) {
            return res.status(403).json({
                success: false,
                message: 'Only blog writers can delete blogs'
            });
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        if (getAuthorId(blog.author) !== String(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own blog'
            });
        }

        await blog.deleteOne();
        return res.status(200).json({
            success: true,
            message: 'Blog deleted permanently'
        });
    } catch (error) {
        console.error('Delete blog error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete blog',
            error: error.message
        });
    }
};

const getBlogComments = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        if (blog.status !== 'approved') {
            return res.status(403).json({ success: false, message: 'Comments are only available on approved blogs' });
        }

        const comments = await BlogComment.find({ blog: req.params.id })
            .populate('author', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            comments
        });
    } catch (error) {
        console.error('Fetch blog comments error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch comments',
            error: error.message
        });
    }
};

const addBlogComment = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Authentication required to comment' });
        }

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        if (blog.status !== 'approved') {
            return res.status(403).json({ success: false, message: 'You can only comment on approved blogs' });
        }

        const trimmedText = typeof req.body.text === 'string' ? req.body.text.trim() : '';
        if (!trimmedText) {
            return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
        }

        const comment = new BlogComment({
            blog: req.params.id,
            author: req.user.id,
            text: trimmedText
        });

        const saved = await comment.save();
        const populated = await BlogComment.findById(saved._id).populate('author', 'name email');

        return res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            comment: populated
        });
    } catch (error) {
        console.error('Add blog comment error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add comment',
            error: error.message
        });
    }
};

module.exports = {
    createBlog,
    getAllBlogs,
    getMyBlogs,
    getBlogById,
    getWriterBlogById,
    updateBlog,
    deleteBlog,
    getBlogComments,
    addBlogComment,
    formatStatusLabel
};
