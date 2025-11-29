const express = require('express')
const router = express.Router()
const pageController = require('../controllers/pageController')
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, pageController.createPage)
router.get('/', pageController.getAllPages)
router.get('/:id', pageController.getPageById)
router.put('/:id', verifyToken, pageController.updatePage)
router.delete('/:id', verifyToken, pageController.deletePage)

module.exports = router
