const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');
const { verifyToken, verifyAdmin, verifyAdminOrAuthor } = require('../middleware/authMiddleware');

// Toutes ces routes sont protégées et réservées à l'admin
router.get('/', verifyToken, verifyAdmin, tagController.getAllTags);
router.get('/pending', verifyToken, verifyAdminOrAuthor, tagController.getPendingTags); // Pour la page de modération
router.patch('/:id/approve', verifyToken, verifyAdminOrAuthor, tagController.approveTag); // On utilise PATCH, plus sémantique pour une mise à jour partielle.
router.patch('/:id/reject', verifyToken, verifyAdminOrAuthor, tagController.rejectTag); // On utilise PATCH pour la cohérence.
router.delete('/:id', verifyToken, verifyAdmin, tagController.deleteTag);

module.exports = router;