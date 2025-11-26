const { Story, Page, Choice, User } = require('../models/index');

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

const getAllStories = async (req, res) => {
    try {
        let stories;
        if (req.user && req.user.role === 'admin') {
            stories = await Story.findAll();
        } else {
            stories = await Story.findAll({
                where: { statut: 'publié' },
            });
        }
        res.json(stories);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

const getStoryById = async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id, {
            include: [
                {
                    model: Page,
                    as: 'pages',
                    include: [
                        {
                            model: Choice,
                            as: 'choicesFrom',
                        }
                    ]
                }
            ]
        });

        if (!story) return res.status(404).json({ message: "Story introuvable" });

        const plain = story.toJSON ? story.toJSON() : story;
        if (plain.pages && Array.isArray(plain.pages)) {
            plain.pages = plain.pages.map(p => ({
                ...p,
                choices: p.choices || p.choicesFrom || []
            }));
        }

        res.json(plain);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

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

const deleteStory = async (req, res) => {
    const t = await Story.sequelize.transaction();
    try {
        const story = await Story.findByPk(req.params.id, { transaction: t });
        if (!story) return res.status(404).json({ message: "Story introuvable" });

        if (story.AuthorId !== req.user.id)
            return res.status(403).json({ message: "Accès refusé" });

        const pages = await Page.findAll({ where: { storyId: story.id }, transaction: t });
        const pageIds = pages.map(p => p.id);
        await Choice.destroy({ where: { source_PageId: pageIds }, transaction: t });
        await Choice.destroy({ where: { next_PageId: pageIds }, transaction: t });
        await Page.destroy({ where: { storyId: story.id }, transaction: t });
        await story.destroy({ transaction: t });

        await t.commit();
        res.json({ message: "Story et toutes ses pages/choix supprimées" });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

const createStoryWithPages = async (req, res) => {
    const t = await Story.sequelize.transaction();
    try {
        const { title, description, pages } = req.body;
        if (!title || !pages || pages.length === 0)
            return res.status(400).json({ message: "Titre et pages obligatoires" });

        let authorId = null;
        if (req.user && req.user.id) authorId = req.user.id;
        else {
            const fallback = await User.findOne({ transaction: t });
            authorId = fallback ? fallback.id : null;
        }

        const story = await Story.create({
            title,
            description,
            AuthorId: authorId
        }, { transaction: t });

        const pageMap = [];
        for (let i = 0; i < pages.length; i++) {
            const p = await Page.create({
                content: pages[i].content,
                isEnding: pages[i].isEnding || false,
                storyId: story.id
            }, { transaction: t });

            const clientTempId = pages[i].id || pages[i].tempId || null;
            pageMap.push({ index: i, id: p.id, tempId: clientTempId, isEnding: pages[i].isEnding || false });
        }

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            if (!pageMap[i].isEnding && page.choices && page.choices.length > 0) {
                const choicesToCreate = page.choices.slice(0, 2);
                for (let choice of choicesToCreate) {
                    let nextPage = null;
                    if (typeof choice.nextPageIndex === 'number') {
                        nextPage = pageMap.find(p => p.index === choice.nextPageIndex);
                    } else if (choice.nextPageTempId) {
                        nextPage = pageMap.find(p => p.tempId === choice.nextPageTempId);
                    } else if (typeof choice.nextPageId === 'number') {
                        nextPage = pageMap.find(p => p.id === choice.nextPageId);
                    }

                    await Choice.create({
                        text: choice.text,
                        source_PageId: pageMap[i].id,
                        next_PageId: nextPage ? nextPage.id : null
                    }, { transaction: t });
                }
            }
        }

        await story.update({ startPageId: pageMap[0].id }, { transaction: t });

        const created = await Story.findByPk(story.id, {
            include: [{ model: Page, as: 'pages', include: [{ model: Choice, as: 'choicesFrom' }] }]
        });
        const payload = created.toJSON();
        payload.pages = payload.pages.map(p => ({ ...p, choices: p.choices || p.choicesFrom || [] }));

        await t.commit();
        res.status(201).json({ message: "Story créée avec succès", storyId: story.id, story: payload });

    } catch (err) {
        await t.rollback();
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

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

const getFullStory = async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id, {
            include: [
                {
                    model: Page,
                    as: 'pages',
                    include: [
                        { model: Choice, as: 'choicesFrom' },
                        { model: Choice, as: 'choicesTo' }
                    ]
                },
                { model: require('../models').User, as: 'author' }
            ]
        });

        if (!story) return res.status(404).json({ message: "Story introuvable" });

        res.json(story);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

const seedTestStory = async (req, res) => {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ message: 'Not allowed in production' });

    try {
        const existing = await Story.findOne({ where: { title: 'DEV_SAMPLE_STORY' } });
        if (existing) {
            const payload = await Story.findByPk(existing.id, {
                include: [{ model: Page, as: 'pages', include: [{ model: Choice, as: 'choicesFrom' }] }]
            });
            const plain = payload.toJSON();
            plain.pages = plain.pages.map(p => ({ ...p, choices: p.choices || p.choicesFrom || [] }));
            return res.json(plain);
        }

        const t = await Story.sequelize.transaction();
        const story = await Story.create({ title: 'DEV_SAMPLE_STORY', description: "Un petit exemple pour tester le lecteur", AuthorId: null }, { transaction: t });

        const p1 = await Page.create({ content: 'Vous êtes à l\'entrée d\'un donjon sombre.', isEnding: false, storyId: story.id }, { transaction: t });
        const p2 = await Page.create({ content: 'Vous trouvez une salle remplie de trésors. FIN.', isEnding: true, storyId: story.id }, { transaction: t });
        const p3 = await Page.create({ content: 'Un piège se déclenche et vous êtes aspiré. FIN.', isEnding: true, storyId: story.id }, { transaction: t });

        await Choice.create({ text: 'Entrer dans le donjon', source_PageId: p1.id, next_PageId: p2.id }, { transaction: t });
        await Choice.create({ text: 'Faire demi-tour', source_PageId: p1.id, next_PageId: p3.id }, { transaction: t });

        await story.update({ startPageId: p1.id }, { transaction: t });

        await t.commit();

        const payload = await Story.findByPk(story.id, { include: [{ model: Page, as: 'pages', include: [{ model: Choice, as: 'choicesFrom' }] }] });
        const plain = payload.toJSON();
        plain.pages = plain.pages.map(p => ({ ...p, choices: p.choices || p.choicesFrom || [] }));

        res.status(201).json(plain);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

module.exports = {
    createStory,
    getAllStories,
    getStoryById,
    updateStory,
    deleteStory,
    createStoryWithPages,
    publishStory,
    getFullStory,
    seedTestStory
};
