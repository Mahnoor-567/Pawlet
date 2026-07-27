const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');

const placeOrder = async (req, res) => {
  try {
    const { deliveryAddress, paymentMethod = 'COD' } = req.body;

    if (!deliveryAddress) {
      return res.status(400).json({ success: false, message: 'deliveryAddress is required' });
    }

    const required = ['name', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!deliveryAddress[field] || !String(deliveryAddress[field]).trim()) {
        return res.status(400).json({ success: false, message: `${field} is required in deliveryAddress` });
      }
    }

    if (paymentMethod !== 'COD') {
      return res.status(400).json({ success: false, message: 'Only COD payment is supported' });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const orderItems = [];
    const stockUpdates = [];

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id || item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: 'A product in your cart no longer exists' });
      }
      if (product.approvalStatus !== 'approved') {
        return res.status(400).json({ success: false, message: `"${product.name}" is no longer available` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Only ${product.stock} available.`
        });
      }

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        name: product.name,
        image: product.image
      });

      stockUpdates.push({ product, quantity: item.quantity });
    }

    const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = new Order({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      paymentMethod: 'COD',
      orderStatus: 'confirmed'
    });

    await order.save();

    for (const { product, quantity } of stockUpdates) {
      product.stock -= quantity;
      await product.save();
    }

    cart.items = [];
    cart.totalAmount = 0;
    await cart.save();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order
    });
  } catch (error) {
    console.error('Place order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to place order', error: error.message });
  }
};

const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.product', 'name image price');

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Get user orders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
      .populate('items.product', 'name image price category');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch order', error: error.message });
  }
};

module.exports = { placeOrder, getUserOrders, getOrderById };
