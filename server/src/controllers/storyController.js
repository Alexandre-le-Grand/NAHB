const Story = require('../models/Story');
const Page = require('../models/Page');
const Choice = require('../models/Choice');

// -----------------------------
// CREATE STORY SIMPLE
// -----------------------------
const createStory = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ message: "Titre obligatoire" });

        const story = await Story.create({
            title,
            description,
            AuthorId: req.user.id
        });

        res.status(201).json(story);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// -----------------------------
// GET ALL STORIES
// -----------------------------
const getAllStories = async (req, res) => {
    try {
        const stories = await Story.findAll();
        res.json(stories);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// -----------------------------
// GET STORY BY ID
// -----------------------------
const getStoryById = async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id);
        if (!story) return res.status(404).json({ message: "Story introuvable" });
        res.json(story);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// -----------------------------
// UPDATE STORY
// -----------------------------
const updateStory = async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id);
        if (!story) return res.status(404).json({ message: "Story introuvable" });

        if (story.AuthorId !== req.user.id)
            return res.status(403).json({ message: "Accès refusé" });

        await story.update(req.body);
        res.json(story);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// -----------------------------
// DELETE STORY
// -----------------------------
const deleteStory = async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id);
        if (!story) return res.status(404).json({ message: "Story introuvable" });

        if (story.AuthorId !== req.user.id)
            return res.status(403).json({ message: "Accès refusé" });

        await story.destroy();
        res.json({ message: "Story supprimée" });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// -----------------------------
// CREATE STORY WITH PAGES + CHOICES
// -----------------------------
const createStoryWithPages = async (req, res) => {
    const t = await Story.sequelize.transaction();
    try {
        const { title, description, pages } = req.body;

        if (!title || !pages || pages.length === 0)
            return res.status(400).json({ message: "Titre et pages obligatoires" });

        // 1️⃣ Création de l'histoire
        const story = await Story.create({
            title,
            description,
            AuthorId: req.user.id
        }, { transaction: t });

        // 2️⃣ Création des pages
        const pageMap = []; // { index, id, isEnding }
        for (let i = 0; i < pages.length; i++) {
            const p = await Page.create({
                content: pages[i].content,
                isEnding: pages[i].isEnding || false,
                storyId: story.id
            }, { transaction: t });

            pageMap.push({ index: i, id: p.id, isEnding: pages[i].isEnding || false });
        }

        // 3️⃣ Création des choix (max 2 par page, sauf pages finales)
        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            if (!pageMap[i].isEnding && page.choices && page.choices.length > 0) {
                const choicesToCreate = page.choices.slice(0, 2);
                for (let choice of choicesToCreate) {
                    const nextPage = pageMap.find(p => p.index === choice.nextPageIndex);
                    await Choice.create({
                        text: choice.text,
                        source_PageId: pageMap[i].id,
                        next_PageId: nextPage ? nextPage.id : null
                    }, { transaction: t });
                }
            }
        }

        // 4️⃣ Définir la startPageId
        await story.update({ startPageId: pageMap[0].id }, { transaction: t });

        await t.commit();
        res.status(201).json({ message: "Story créée avec succès", storyId: story.id });

    } catch (err) {
        await t.rollback();
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// -----------------------------
// PUBLISH STORY (admin only)
// -----------------------------
const publishStory = async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id);
        if (!story) return res.status(404).json({ message: "Story introuvable" });

        await story.update({ statut: "publié" });
        res.json({ message: "Story publiée", story });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// -----------------------------
// EXPORT
// -----------------------------
module.exports = {
    createStory,
    getAllStories,
    getStoryById,
    updateStory,
    deleteStory,
    createStoryWithPages,
    publishStory
};
