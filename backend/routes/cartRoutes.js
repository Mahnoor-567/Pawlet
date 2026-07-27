const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  addToCart,
  getCart,
  updateQuantity,
  removeItem,
  clearCart
} = require('../controllers/cartController');

router.use(authMiddleware);

router.post('/add', addToCart);
router.get('/', getCart);
router.put('/update/:productId', updateQuantity);
router.delete('/remove/:productId', removeItem);
router.delete('/clear', clearCart);

module.exports = router;
