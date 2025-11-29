const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.post('/', verifyToken, storyController.createStory);
router.get('/', verifyToken, storyController.getAllStories);
router.get('/mine', verifyToken, storyController.getMyStories);
router.get('/:id', storyController.getStoryById);
router.put('/:id', verifyToken, storyController.updateStory);
router.delete('/:id', verifyToken, storyController.deleteStory);

router.post('/createStoryWithPages', verifyToken, storyController.createStoryWithPages);
router.put('/:id/full', verifyToken, storyController.updateStoryWithPages);
if (process.env.NODE_ENV !== 'production') {
	router.post('/createStoryWithPages-dev', storyController.createStoryWithPages);
}

if (process.env.NODE_ENV !== 'production') {
	if (typeof storyController.seedTestStory === 'function') {
		router.get('/seed', storyController.seedTestStory);
	}
	// Add a helper to seed multiple nice example stories (dev only)
	if (typeof storyController.seedSampleStories === 'function') {
		router.get('/seed-samples', storyController.seedSampleStories);
	}
}

router.put('/:id/publish', verifyToken, verifyAdmin, storyController.publishStory);

router.patch('/:id/suspend', verifyToken, verifyAdmin, storyController.suspendStory);

router.post('/playthroughs', verifyToken, storyController.recordPlaythrough);

router.post('/playthroughs/start', verifyToken, storyController.startPlaythrough);

router.get('/:id/full', verifyToken, storyController.getFullStory);


module.exports = router;
