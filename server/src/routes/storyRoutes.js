const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const db = require('../models'); // Importer l'objet db pour que la route de diagnostic fonctionne
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware'); // Garder pour les routes protégées

router.post('/', verifyToken, storyController.createStory);

// Routes spécifiques AVANT les routes génériques
router.get('/', verifyToken, storyController.getAllStories);
router.get('/mine', verifyToken, storyController.getMyStories);

// Routes de diagnostic (à garder pour l'instant)
router.get('/debug/check-authors', async (req, res) => { /* ... code existant ... */ });
router.get('/debug/show-me-everything', async (req, res) => { /* ... code existant ... */ });
router.get('/:id/stats', verifyToken, storyController.getStoryStats); // Nouvelle route pour les stats

// La route générique avec :id doit être APRÈS les routes spécifiques comme /mine
router.get('/:id', storyController.getStoryById); 
router.put('/:id', verifyToken, storyController.updateStory);

// Route pour l'éditeur de page : GET pour charger, PUT pour sauvegarder
router.get('/:id/full', verifyToken, storyController.getFullStory);
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

module.exports = router;
