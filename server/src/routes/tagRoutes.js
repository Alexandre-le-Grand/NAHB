const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Toutes ces routes sont protégées et réservées à l'admin
router.get('/', verifyToken, verifyAdmin, tagController.getAllTags);
router.patch('/:id/approve', verifyToken, verifyAdmin, tagController.approveTag);
router.delete('/:id', verifyToken, verifyAdmin, tagController.deleteTag);

module.exports = router;