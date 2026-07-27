const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { sendMessage, sendGuestMessage, getChatHistory, clearHistory } = require('../controllers/chatController');

router.post('/message', authMiddleware, sendMessage);
router.post('/guest-message', sendGuestMessage);
router.get('/history', authMiddleware, getChatHistory);
router.delete('/history', authMiddleware, clearHistory);

module.exports = router;
