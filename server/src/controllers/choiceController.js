const Choice = require('../models/Choice')

exports.createChoice = async (req, res) => {
  try {
    const { text, source_PageId, next_PageId } = req.body
    const newChoice = await Choice.create({ text, source_PageId, next_PageId })
    res.status(201).json(newChoice)
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
}

exports.getAllChoices = async (req, res) => {
  try {
    const choices = await Choice.findAll()
    res.json(choices)
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
}

exports.getChoiceById = async (req, res) => {
  try {
    const choice = await Choice.findByPk(req.params.id)
    if (!choice) return res.status(404).json({ message: 'Choice introuvable' })
    res.json(choice)
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
}

exports.updateChoice = async (req, res) => {
  try {
    const choice = await Choice.findByPk(req.params.id)
    if (!choice) return res.status(404).json({ message: 'Choice introuvable' })
    await choice.update(req.body)
    res.json(choice)
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
}

exports.deleteChoice = async (req, res) => {
  try {
    const choice = await Choice.findByPk(req.params.id)
    if (!choice) return res.status(404).json({ message: 'Choice introuvable' })
    await choice.destroy()
    res.json({ message: 'Choice supprimé avec succès' })
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message })
  }
}
