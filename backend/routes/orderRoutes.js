const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { placeOrder, getUserOrders, getOrderById } = require('../controllers/orderController');

router.use(authMiddleware);

router.post('/', placeOrder);
router.get('/my-orders', getUserOrders);
router.get('/:id', getOrderById);

module.exports = router;
