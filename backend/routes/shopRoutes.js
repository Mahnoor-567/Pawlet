const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const sellerMiddleware = require('../middleware/sellerMiddleware');
const { createShop, getMyShop } = require('../controllers/shopController');

router.post('/', authMiddleware, sellerMiddleware, createShop);
router.get('/mine', authMiddleware, sellerMiddleware, getMyShop);

module.exports = router;
