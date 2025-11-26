const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// CRUD de base
router.post('/', verifyToken, storyController.createStory);
router.get('/', verifyToken, storyController.getAllStories);
router.get('/:id', storyController.getStoryById);
router.put('/:id', verifyToken, storyController.updateStory);
router.delete('/:id', verifyToken, storyController.deleteStory);

// Création complète avec pages et choix
router.post('/createStoryWithPages', verifyToken, storyController.createStoryWithPages);
// Dev helper: allow posting story with pages without auth in development for quick testing
if (process.env.NODE_ENV !== 'production') {
	router.post('/createStoryWithPages-dev', storyController.createStoryWithPages);
}

// Dev-only helper to seed a sample story for testing the reader UI
if (process.env.NODE_ENV !== 'production') {
	if (typeof storyController.seedTestStory === 'function') {
		router.get('/seed', storyController.seedTestStory);
	}
	// Add a helper to seed multiple nice example stories (dev only)
	if (typeof storyController.seedSampleStories === 'function') {
		router.get('/seed-samples', storyController.seedSampleStories);
	}
}

// Publication (admin only)
router.put('/:id/publish', verifyToken, verifyAdmin, storyController.publishStory);

router.get('/:id/full', verifyToken, storyController.getFullStory);


module.exports = router;
