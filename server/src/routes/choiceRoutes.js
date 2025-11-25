const express = require('express')
const router = express.Router()
const choiceController = require('../controllers/choiceController')

router.post('/', choiceController.createChoice)
router.get('/', choiceController.getAllChoices)
router.get('/:id', choiceController.getChoiceById)
router.put('/:id', choiceController.updateChoice)
router.delete('/:id', choiceController.deleteChoice)

module.exports = router
