const Story = require('../models/Story')
const Page = require('../models/Page')
const Choice = require('../models/Choice')

exports.createStoryWithPages = async (req, res) => {
    try {
        const { title, description, pages } = req.body
        if (!title || !pages || !Array.isArray(pages) || pages.length === 0) {
            return res.status(400).json({ message: "Titre et pages obligatoires" })
        }

        const authorId = req.user.id

        const story = await Story.create({
            title,
            description,
            AuthorId: authorId
        })

        const createdPages = []

        for (let i = 0; i < pages.length; i++) {
            const pageData = pages[i]
            const page = await Page.create({
                content: pageData.content,
                isEnding: pageData.isEnding || false,
                storyId: story.id
            })
            createdPages.push({ ...pageData, id: page.id, index: i })
        }

        for (let i = 0; i < pages.length; i++) {
            const pageData = pages[i]
            if (pageData.choices && Array.isArray(pageData.choices)) {
                for (let choiceData of pageData.choices) {
                    const nextPage = createdPages.find(p => p.index === choiceData.nextPageIndex)
                    await Choice.create({
                        text: choiceData.text,
                        source_PageId: createdPages[i].id,
                        next_PageId: nextPage ? nextPage.id : null
                    })
                }
            }
        }

        await story.update({ startPageId: createdPages[0].id })

        res.status(201).json({ message: "Story créée avec succès", storyId: story.id })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Erreur serveur", error: error.message })
    }
}

// ---- Add missing standard CRUD handlers expected by routes ----
exports.createStory = async (req, res) => {
    try {
        const { title, description } = req.body
        if (!title) return res.status(400).json({ message: 'Titre obligatoire' })

        const authorId = req.user && req.user.id ? req.user.id : null
        const newStory = await Story.create({ title, description, AuthorId: authorId })
        res.status(201).json(newStory)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
}

exports.getAllStories = async (req, res) => {
    try {
        const stories = await Story.findAll()
        res.json(stories)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
}

exports.getStoryById = async (req, res) => {
    try {
        const { id } = req.params
        const story = await Story.findByPk(id)
        if (!story) return res.status(404).json({ message: 'Story introuvable' })
        res.json(story)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
}

exports.updateStory = async (req, res) => {
    try {
        const { id } = req.params
        const story = await Story.findByPk(id)
        if (!story) return res.status(404).json({ message: 'Story introuvable' })

        if (req.user && req.user.id && story.AuthorId && req.user.id !== story.AuthorId) {
            return res.status(403).json({ message: 'Accès refusé' })
        }

        await story.update(req.body)
        res.json(story)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
}

exports.deleteStory = async (req, res) => {
    try {
        const { id } = req.params
        const story = await Story.findByPk(id)
        if (!story) return res.status(404).json({ message: 'Story introuvable' })

        if (req.user && req.user.id && story.AuthorId && req.user.id !== story.AuthorId) {
            return res.status(403).json({ message: 'Accès refusé' })
        }

        await story.destroy()
        res.json({ message: 'Story supprimée' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Erreur serveur', error: error.message })
    }
}
