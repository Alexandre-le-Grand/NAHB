const { Story, Page, Choice, User } = require('../models/index');


// CREATE STORY SIMPLE
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

// GET ALL STORIES (filtrage selon rôle)
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

// GET STORY BY ID
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

        // Convert Sequelize instance to plain object and ensure pages have `choices` array
        const plain = story.toJSON ? story.toJSON() : story;
        if (plain.pages && Array.isArray(plain.pages)) {
            plain.pages = plain.pages.map(p => ({
                ...p,
                // prefer existing `choices` but fallback to `choicesFrom` alias used in associations
                choices: p.choices || p.choicesFrom || []
            }));
        }

        res.json(plain);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};
// UPDATE STORY
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

// DELETE STORY
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

// CREATE STORY WITH PAGES + CHOICES
const createStoryWithPages = async (req, res) => {
    const t = await Story.sequelize.transaction();
    try {
        const { title, description, pages } = req.body;

        if (!title || !pages || pages.length === 0)
            return res.status(400).json({ message: "Titre et pages obligatoires" });

        // determine the author for the story; if there's no authenticated user, pick any existing user (dev fallback)
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

        // pageMap keeps mapping between client-provided temp ids / indexes and created DB ids
        const pageMap = [];
        for (let i = 0; i < pages.length; i++) {
            const p = await Page.create({
                content: pages[i].content,
                isEnding: pages[i].isEnding || false,
                storyId: story.id
            }, { transaction: t });

            // capture the client's temp id if provided (helps avoid making clients supply DB ids)
            const clientTempId = pages[i].id || pages[i].tempId || null;
            pageMap.push({ index: i, id: p.id, tempId: clientTempId, isEnding: pages[i].isEnding || false });
        }

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i];
            if (!pageMap[i].isEnding && page.choices && page.choices.length > 0) {
                const choicesToCreate = page.choices.slice(0, 2);
                for (let choice of choicesToCreate) {
                    // Support several ways the client may reference a next page:
                    // - choice.nextPageIndex (numeric index)
                    // - choice.nextPageTempId (client-generated temporary id)
                    // - choice.nextPageId (an actual DB id) — still accepted
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

        await t.commit();

        // Return the created story with pages and choices (map aliases to `choices` for client)
        const created = await Story.findByPk(story.id, {
            include: [{ model: Page, as: 'pages', include: [{ model: Choice, as: 'choicesFrom' }] }]
        });
        const payload = created.toJSON();
        payload.pages = payload.pages.map(p => ({ ...p, choices: p.choices || p.choicesFrom || [] }));

        res.status(201).json({ message: "Story créée avec succès", storyId: story.id, story: payload });

    } catch (err) {
        await t.rollback();
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// PUBLISH STORY (admin only)
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

module.exports = {
    createStory,
    getAllStories,
    getStoryById,
    updateStory,
    deleteStory,
    createStoryWithPages,
    publishStory
};

// Récupère une story complète (pages, choix et auteur) — utilisée par la route /:id/full
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

// Export the new handler
module.exports.getFullStory = getFullStory;

// Dev helper: create a sample story with pages and choices for UI testing.
const seedTestStory = async (req, res) => {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ message: 'Not allowed in production' });

    try {
        // If a test story already exists, return it
        const existing = await Story.findOne({ where: { title: 'DEV_SAMPLE_STORY' } });
        if (existing) {
            const payload = await Story.findByPk(existing.id, {
                include: [{ model: Page, as: 'pages', include: [{ model: Choice, as: 'choicesFrom' }] }]
            });
            const plain = payload.toJSON();
            plain.pages = plain.pages.map(p => ({ ...p, choices: p.choices || p.choicesFrom || [] }));
            return res.json(plain);
        }

        // Create a new story with pages and choices
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

module.exports.seedTestStory = seedTestStory;

// Dev-only: seed multiple nice example stories (3) with pages + choices
const seedSampleStories = async (req, res) => {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ message: 'Not allowed in production' });

    const t = await Story.sequelize.transaction();
    try {
        const samples = [
            {
                title: "L'étoile perdue",
                description: "Une petite aventure cosmique où tu sauves une étoile.",
                pages: [
                    { id: 'p0', content: 'Une étoile tombe près de toi. Que fais-tu ?', isEnding: false, choices: [{ text: 'La ramasser', next: 1 }, { text: 'La laisser', next: 2 }] },
                    { id: 'p1', content: 'L\'étoile te guide dans le ciel. FIN.', isEnding: true, choices: [] },
                    { id: 'p2', content: 'L\'étoile se repose et s\'éteint. FIN.', isEnding: true, choices: [] }
                ]
            },
            {
                title: 'Le jardin sous la mer',
                description: 'Un jardin lumineux au fond de l\'océan.',
                pages: [
                    { id: 'p0', content: 'Tu trouves un jardin sous l\'eau.', isEnding: false, choices: [{ text: 'Explorer le tunnel', next: 1 }, { text: 'Cueillir une fleur', next: 2 }] },
                    { id: 'p1', content: 'Une grotte raconte une histoire ancienne. FIN.', isEnding: true, choices: [] },
                    { id: 'p2', content: 'La fleur t\'accorde un souhait — tu changes. FIN.', isEnding: true, choices: [] }
                ]
            },
            {
                title: 'La bibliothèque du temps',
                description: 'Des livres qui montrent d\'autres vies possibles.',
                pages: [
                    { id: 'p0', content: 'La bibliothèque s\'ouvre devant toi.', isEnding: false, choices: [{ text: 'Ouvrir le livre rouge', next: 1 }, { text: 'Aller à la salle d\'horloges', next: 2 }] },
                    { id: 'p1', content: 'Tu vois un futur que tu aurais pu choisir. FIN.', isEnding: true, choices: [] },
                    { id: 'p2', content: 'Réparer une horloge te rend un souvenir. FIN.', isEnding: true, choices: [] }
                ]
            }
        ];

        // Find or create a fallback dev user
        let author = await User.findOne({ transaction: t });
        if (!author) {
            author = await User.create({ username: 'dev_sample', password: 'devpass', role: 'admin' }, { transaction: t });
        }

        const created = [];
        for (const sample of samples) {
            // skip if story exists
            let story = await Story.findOne({ where: { title: sample.title }, transaction: t });
            if (story) {
                const payload = await Story.findByPk(story.id, { include: [{ model: Page, as: 'pages', include: [{ model: Choice, as: 'choicesFrom' }] }], transaction: t });
                const plain = payload.toJSON();
                plain.pages = plain.pages.map(p => ({ ...p, choices: p.choices || p.choicesFrom || [] }));
                created.push(plain);
                continue;
            }

            story = await Story.create({ title: sample.title, description: sample.description, AuthorId: author.id, statut: 'publié' }, { transaction: t });

            const pageMap = [];
            for (let i = 0; i < sample.pages.length; i++) {
                const p = await Page.create({ content: sample.pages[i].content, isEnding: sample.pages[i].isEnding, storyId: story.id }, { transaction: t });
                pageMap.push({ index: i, id: p.id, tempId: sample.pages[i].id });
            }

            for (let i = 0; i < sample.pages.length; i++) {
                const pd = sample.pages[i];
                if (!pd.isEnding && pd.choices) {
                    for (const c of pd.choices) {
                        const next = pageMap[c.next];
                        await Choice.create({ text: c.text, source_PageId: pageMap[i].id, next_PageId: next ? next.id : null }, { transaction: t });
                    }
                }
            }

            await story.update({ startPageId: pageMap[0].id }, { transaction: t });

            const payload = await Story.findByPk(story.id, { include: [{ model: Page, as: 'pages', include: [{ model: Choice, as: 'choicesFrom' }] }], transaction: t });
            const plain = payload.toJSON();
            plain.pages = plain.pages.map(p => ({ ...p, choices: p.choices || p.choicesFrom || [] }));
            created.push(plain);
        }

        await t.commit();
        res.json({ message: 'Samples seeded', stories: created });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};

module.exports.seedSampleStories = seedSampleStories;
