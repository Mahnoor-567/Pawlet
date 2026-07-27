const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const User = require('../models/User');
const Product = require('../models/Product');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildPublicFilter = (query) => {
  const filter = { approvalStatus: 'approved' };

  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search) {
    filter.name = { $regex: escapeRegex(search), $options: 'i' };
  }

  const category = typeof query.category === 'string' ? query.category.trim() : '';
  if (category && category !== 'all') {
    filter.category = category;
  }

  return filter;
};

const buildSort = (sortParam) => {
  switch (sortParam) {
    case 'price_asc':
      return { price: 1 };
    case 'price_desc':
      return { price: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
};

// Create product (seller with active shop only)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.shopStatus !== 'active') {
      return res.status(403).json({ success: false, message: 'Create shop first' });
    }

    const { name, description, price, image, category, stock } = req.body;
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedDescription = typeof description === 'string' ? description.trim() : '';
    const parsedPrice = typeof price === 'number' ? price : Number(price);
    const parsedStock = stock !== undefined ? Number(stock) : 0;

    if (!trimmedName || !trimmedDescription || isNaN(parsedPrice)) {
      return res.status(400).json({ success: false, message: 'name, description, and price are required' });
    }

    if (parsedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number' });
    }

    if (isNaN(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be a non-negative number' });
    }

    const productCategory = category && Product.schema.path('category').enumValues.includes(category)
      ? category
      : 'Other';

    let imageUrl = '';
    if (req.file) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    } else if (image) {
      imageUrl = image;
    }

    const product = new Product({
      sellerId: user._id,
      shopId: user._id,
      name: trimmedName,
      description: trimmedDescription,
      category: productCategory,
      price: parsedPrice,
      stock: parsedStock,
      image: imageUrl,
      approvalStatus: 'approved'
    });

    const saved = await product.save();
    return res.status(201).json({ success: true, message: 'Product added to your shop.', product: saved });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
});

// Get available product categories
router.get('/categories', async (_req, res) => {
  try {
    const categories = Product.schema.path('category').enumValues;
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Fetch categories error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
  }
});

// Get products for current seller
router.get('/mine', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Fetch my products error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch your products', error: error.message });
  }
});

// Get all products (public) — search, category filter, price sort
router.get('/', async (req, res) => {
  try {
    const filter = buildPublicFilter(req.query);
    const sort = buildSort(req.query.sort);

    const products = await Product.find(filter).sort(sort);
    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
});

// Get single product by ID (public — approved only)
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      approvalStatus: 'approved'
    })
      .populate('shopId', 'name shopName shopDescription shopStatus')
      .populate('sellerId', 'name shopName shopDescription shopStatus');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const shop = product.shopId || product.sellerId;
    const seller = product.sellerId;

    return res.status(200).json({
      success: true,
      product: {
        _id: product._id,
        name: product.name,
        image: product.image,
        category: product.category,
        price: product.price,
        stock: product.stock,
        description: product.description,
        shop: shop ? {
          _id: shop._id,
          name: shop.name,
          shopName: shop.shopName,
          shopDescription: shop.shopDescription,
          shopStatus: shop.shopStatus
        } : null,
        seller: seller ? {
          _id: seller._id,
          name: seller.name,
          shopName: seller.shopName
        } : null
      }
    });
  } catch (error) {
    console.error('Fetch product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
  }
});

// Update a product (seller owns only)
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update your own products' });
    }

    const { name, description, price, image, category, stock } = req.body;
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedDescription = typeof description === 'string' ? description.trim() : '';
    const parsedPrice = typeof price === 'number' ? price : Number(price);

    if (!trimmedName || !trimmedDescription || isNaN(parsedPrice)) {
      return res.status(400).json({ success: false, message: 'name, description, and price are required' });
    }

    if (parsedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number' });
    }

    product.name = trimmedName;
    product.description = trimmedDescription;
    product.price = parsedPrice;

    if (category && Product.schema.path('category').enumValues.includes(category)) {
      product.category = category;
    }

    if (stock !== undefined) {
      const parsedStock = Number(stock);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ success: false, message: 'Stock must be a non-negative number' });
      }
      product.stock = parsedStock;
    }

    if (req.file) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      product.image = `${baseUrl}/uploads/${req.file.filename}`;
    } else if (image && image !== product.image) {
      product.image = image;
    }

    const updated = await product.save();
    return res.status(200).json({ success: true, message: 'Product updated successfully', product: updated });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
});

// Delete a product (seller owns)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own products' });
    }

    await product.deleteOne();
    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
});

module.exports = router;
