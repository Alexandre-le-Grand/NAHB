const express = require('express')
const router = express.Router()
const storyController = require('../controllers/storyController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/', authMiddleware, storyController.createStory)
router.get('/', storyController.getAllStories)
router.get('/:id', storyController.getStoryById)
router.put('/:id', authMiddleware, storyController.updateStory)
router.delete('/:id', authMiddleware, storyController.deleteStory)

router.post('/createStoryWithPages', authMiddleware, storyController.createStoryWithPages)

module.exports = router
