const Page = require('../models/Page')

exports.createPage = async (req, res) => {
    try {
        const { content, isEnding, storyId } = req.body
        const newPage = await Page.create({ content, isEnding, storyId })
        res.status(201).json(newPage)
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message })
    }
}

exports.getAllPages = async (req, res) => {
    try {
        const pages = await Page.findAll()
        res.json(pages)
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message })
    }
}

exports.getPageById = async (req, res) => {
    try {
        const { id } = req.params
        const page = await Page.findByPk(id)
        if (!page) return res.status(404).json({ message: "Page introuvable" })
        res.json(page)
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message })
    }
}

exports.updatePage = async (req, res) => {
    try {
        const { id } = req.params
        const { content, isEnding } = req.body
        const page = await Page.findByPk(id)
        if (!page) return res.status(404).json({ message: "Page introuvable" })
        await page.update({ content, isEnding })
        res.json(page)
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message })
    }
}

exports.deletePage = async (req, res) => {
    try {
        const { id } = req.params
        const page = await Page.findByPk(id)
        if (!page) return res.status(404).json({ message: "Page introuvable" })
        await page.destroy()
        res.json({ message: "Page supprimée" })
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message })
    }
}
