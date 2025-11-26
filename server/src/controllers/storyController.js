const { Story, Page, Choice, User, Playthrough } = require('../models/index');
const { Op } = require('sequelize');


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
            // Les utilisateurs non-admin voient les histoires publiées ET leurs propres brouillons.
            stories = await Story.findAll({
                where: {
                    [Op.or]: [
                        { statut: 'publié' },
                        { AuthorId: req.user ? req.user.id : null }
                    ]
                },
            });
        }

        res.json(stories);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// GET CURRENT USER'S STORIES
const getMyStories = async (req, res) => {
    try {
        const authorId = req.user.id;
        const stories = await Story.findAll({
            where: { AuthorId: authorId },
        });
        res.json(stories);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur lors de la récupération de vos histoires.", error: err.message });
    }
};

// GET STORY BY ID
const getStoryById = async (req, res) => {
    try {
        // On inclut l'AuthorId pour vérifier les permissions côté client
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
                ],
                attributes: { include: ['AuthorId'] }
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

        if (story.AuthorId !== req.user.id && req.user.role !== 'admin')
            return res.status(403).json({ message: "Accès refusé" });

        await story.update(req.body);
        res.json(story);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// UPDATE STORY WITH PAGES + CHOICES
const updateStoryWithPages = async (req, res) => {
    const { id } = req.params;
    const t = await Story.sequelize.transaction();
    try {
        const { title, description, pages } = req.body;

        const story = await Story.findByPk(id, { transaction: t });
        if (!story) {
            await t.rollback();
            return res.status(404).json({ message: "Histoire introuvable" });
        }

        // Vérification des permissions
        if (story.AuthorId !== req.user.id && req.user.role !== 'admin') {
            await t.rollback();
            return res.status(403).json({ message: "Accès refusé" });
        }

        // Mise à jour du titre et de la description
        await story.update({ title, description }, { transaction: t });

        // Suppression des anciennes pages et choix
        const oldPages = await Page.findAll({ where: { storyId: story.id }, transaction: t });
        if (oldPages.length > 0) {
            const oldPageIds = oldPages.map(p => p.id);
            await Choice.destroy({ where: { source_PageId: oldPageIds } }, { transaction: t });
            await Page.destroy({ where: { storyId: story.id } }, { transaction: t });
        }

        // Recréation des pages et choix (logique similaire à createStoryWithPages)
        const pageMap = [];
        for (let i = 0; i < pages.length; i++) {
            const p = await Page.create({
                content: pages[i].content,
                isEnding: pages[i].isEnding || false,
                storyId: story.id
            }, { transaction: t });
            pageMap.push({ index: i, id: p.id, tempId: pages[i].id });
        }

        for (let i = 0; i < pages.length; i++) {
            const pageData = pages[i];
            if (!pageMap[i].isEnding && pageData.choices && pageData.choices.length > 0) {
                for (let choice of pageData.choices) {
                    const nextPage = pageMap.find(p => p.tempId === choice.nextPageTempId);
                    await Choice.create({
                        text: choice.text,
                        source_PageId: pageMap[i].id,
                        next_PageId: nextPage ? nextPage.id : null
                    }, { transaction: t });
                }
            }
        }

        await story.update({ startPageId: pageMap.length > 0 ? pageMap[0].id : null }, { transaction: t });

        await t.commit();
        res.status(200).json({ message: "Histoire mise à jour avec succès", storyId: story.id });
    } catch (err) {
        await t.rollback();
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour", error: err.message });
    }
};

// DELETE STORY
const deleteStory = async (req, res) => {
    try {
        const story = await Story.findByPk(req.params.id);
        if (!story) return res.status(404).json({ message: "Story introuvable" });

        if (story.AuthorId !== req.user.id && req.user.role !== 'admin')
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

// START A PLAYTHROUGH (mark as 'in_progress')
const startPlaythrough = async (req, res) => {
    try {
        const { storyId } = req.body;
        const userId = req.user.id;

        if (!storyId) {
            return res.status(400).json({ message: "L'identifiant de l'histoire est requis." });
        }

        // Find or create a playthrough. If it exists and is 'finished', we don't change it.
        // If it exists and is 'in_progress', we return it.
        // If it doesn't exist, we create it as 'in_progress'.
        const [playthrough, created] = await Playthrough.findOrCreate({
            where: { UserId: userId, StoryId: storyId },
            defaults: { EndingPageId: null, status: 'in_progress' } // Use null for EndingPageId when in progress
        });

        // If it was already finished, we don't want to revert its status
        if (!created && playthrough.status === 'finished') {
            return res.status(200).json({ message: "Partie déjà terminée.", playthrough });
        }

        res.status(created ? 201 : 200).json({ message: created ? "Partie commencée." : "Partie déjà en cours.", playthrough });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur lors du démarrage de la partie.", error: err.message });
    }
};

// RECORD A COMPLETED PLAYTHROUGH (update status to 'finished')
const recordPlaythrough = async (req, res) => {
    try {
        const { storyId, endingPageId } = req.body;
        const userId = req.user.id;

        if (!storyId || endingPageId === undefined || endingPageId === null) { // endingPageId peut être 0, donc vérifier undefined/null
            return res.status(400).json({ message: "L'identifiant de l'histoire et de la page de fin sont requis." });
        }

        // Try to find an existing playthrough (either in_progress or finished)
        let playthrough = await Playthrough.findOne({ where: { UserId: userId, StoryId: storyId } });

        if (playthrough) {
            // Update existing playthrough to 'finished'
            await playthrough.update({ EndingPageId: endingPageId, status: 'finished' });
            res.status(200).json({ message: "Partie mise à jour à 'finie'.", playthrough });
        } else {
            // If no playthrough exists (e.g., user jumped directly to an ending), create a new one as 'finished'
            playthrough = await Playthrough.create({
                UserId: userId,
                StoryId: storyId,
                EndingPageId: endingPageId,
                status: 'finished'
            });
            res.status(201).json({ message: "Partie enregistrée comme 'finie'.", playthrough });
        }

    } catch (err) {
        res.status(500).json({ message: "Erreur serveur lors de l'enregistrement de la partie.", error: err.message });
    }
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
                    ]
                },
                { model: require('../models').User, as: 'author' }
            ]
        });

        if (!story) return res.status(404).json({ message: "Story introuvable" });

        // Convertir l'instance Sequelize en objet simple et s'assurer que les pages ont un tableau `choices`
        const plain = story.toJSON ? story.toJSON() : story;
        if (plain.pages && Array.isArray(plain.pages)) {
            plain.pages = plain.pages.map(p => ({
                ...p,
                // préférer `choices` existant mais se rabattre sur l'alias `choicesFrom` utilisé dans les associations
                choices: p.choices || p.choicesFrom || []
            }));
        }

        res.json(plain);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

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

module.exports = {
    createStory,
    getAllStories,
    getMyStories,
    getStoryById,
    updateStory,
    updateStoryWithPages,
    deleteStory,
    createStoryWithPages,
    publishStory,
    recordPlaythrough,
    getFullStory,
    startPlaythrough, // Export the new function
    seedTestStory,
    seedSampleStories
};