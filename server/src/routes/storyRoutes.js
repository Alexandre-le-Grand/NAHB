const express = require('express');
const router = express.Router();

const storyController = require('../controllers/storyController');

// Import PROPRE des middlewares
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// CRUD de base
router.post('/', verifyToken, storyController.createStory);
router.get('/', storyController.getAllStories);
router.get('/:id', storyController.getStoryById);
router.put('/:id', verifyToken, storyController.updateStory);
router.delete('/:id', verifyToken, storyController.deleteStory);

// Création complète avec pages et choix
router.post('/createStoryWithPages', verifyToken, storyController.createStoryWithPages);

// Publication (admin only)
router.put('/:id/publish', verifyToken, verifyAdmin, storyController.publishStory);

module.exports = router;
