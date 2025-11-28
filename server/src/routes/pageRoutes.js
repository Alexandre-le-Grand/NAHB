const express = require('express')
const router = express.Router()
const pageController = require('../controllers/pageController')
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, pageController.createPage)
router.get('/', pageController.getAllPages)
router.get('/:id', pageController.getPageById)
router.put('/:id', authMiddleware, pageController.updatePage)
router.delete('/:id', authMiddleware, pageController.deletePage)

module.exports = router
