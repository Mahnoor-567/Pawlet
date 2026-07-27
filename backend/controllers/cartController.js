const Cart = require('../models/Cart');
const Product = require('../models/Product');

const calcTotal = (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0);

const formatCart = (cart) => {
  if (!cart) return { items: [], totalAmount: 0 };
  const obj = cart.toObject();
  obj.items = obj.items.map((item) => ({
    _id: item._id,
    productId: item.product?._id || item.product,
    product: item.product,
    quantity: item.quantity,
    price: item.price,
    name: item.product?.name || '',
    image: item.product?.image || '',
    stock: item.product?.stock
  }));
  return obj;
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [], totalAmount: 0 });
    await cart.save();
  }
  return cart;
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = parseInt(quantity, 10);

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'quantity must be at least 1' });
    }

    const product = await Product.findOne({ _id: productId, approvalStatus: 'approved' });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found or not available' });
    }
    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: 'Product is out of stock' });
    }

    const cart = await getOrCreateCart(req.user.id);
    const existing = cart.items.find((item) => item.product.toString() === productId);

    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available in stock`
        });
      }
      existing.quantity = newQty;
      existing.price = product.price;
    } else {
      if (qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available in stock`
        });
      }
      cart.items.push({ product: product._id, quantity: qty, price: product.price });
    }

    cart.totalAmount = calcTotal(cart.items);
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.product');
    return res.status(200).json({
      success: true,
      message: 'Product added to cart',
      cart: formatCart(populated)
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to add to cart', error: error.message });
  }
};

const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) {
      return res.status(200).json({ success: true, cart: { items: [], totalAmount: 0 } });
    }
    return res.status(200).json({ success: true, cart: formatCart(cart) });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch cart', error: error.message });
  }
};

const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({ success: false, message: 'quantity must be at least 1' });
    }

    const product = await Product.findOne({ _id: productId, approvalStatus: 'approved' });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (qty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock`
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    item.quantity = qty;
    item.price = product.price;
    cart.totalAmount = calcTotal(cart.items);
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.product');
    return res.status(200).json({ success: true, message: 'Cart updated', cart: formatCart(populated) });
  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update cart', error: error.message });
  }
};

const removeItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const before = cart.items.length;
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    if (cart.items.length === before) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }

    cart.totalAmount = calcTotal(cart.items);
    await cart.save();

    const populated = await Cart.findById(cart._id).populate('items.product');
    return res.status(200).json({ success: true, message: 'Item removed', cart: formatCart(populated) });
  } catch (error) {
    console.error('Remove cart item error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove item', error: error.message });
  }
};

const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { items: [], totalAmount: 0 },
      { upsert: true }
    );
    return res.status(200).json({ success: true, message: 'Cart cleared', cart: { items: [], totalAmount: 0 } });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear cart', error: error.message });
  }
};

module.exports = { addToCart, getCart, updateQuantity, removeItem, clearCart };
