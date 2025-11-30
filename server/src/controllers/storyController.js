const db = require('../models/index');
const { Op, Transaction } = require('sequelize');


// CREATE STORY SIMPLE
const createStory = async (req, res) => {
    try {
        const { title, description, tags } = req.body; // On récupère les tags
        if (!title) return res.status(400).json({ message: "Titre obligatoire" });
        
        const story = await db.sequelize.transaction(async (t) => {
            const newStory = await db.Story.create({
                title,
                description,
                AuthorId: req.user.id
            }, { transaction: t });

            if (tags && tags.length > 0) {
                const tagInstances = await Promise.all(
                    tags.map(tagName => db.Tag.findOrCreate({
                        where: { name: tagName.toLowerCase() },
                        defaults: { name: tagName.toLowerCase(), status: 'pending' }, // Les nouveaux tags sont en attente
                        transaction: t
                    }).then(([tag]) => tag))
                );
                await newStory.setTags(tagInstances, { transaction: t });
            }

            return newStory;
        });



        res.status(201).json(story);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// GET ALL STORIES (filtrage selon rôle)
const getAllStories = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Accès non autorisé, utilisateur non trouvé dans la requête." });
        }
        const { role, id: userId } = req.user;

        // Règle 1: L'admin voit tout.
        if (role === 'admin') {
            const stories = await db.Story.findAll({
                include: [
                    { model: db.User, as: 'author', attributes: ['id', 'username'] },
                    { model: db.Tag, through: { attributes: [] } } // Inclure les tags
                ]
            });
            return res.json(stories);
        } else {
            // Pour tous les autres, on prépare le filtre des auteurs bannis.
            const bannedUsers = await db.User.findAll({
                where: { isBanned: true },
                attributes: ['id']
            });
            const bannedUserIds = bannedUsers.map(u => u.id);

            let whereClause;

             // Règle 3: L'utilisateur simple ne voit que les histoires publiées (par des non-bannis).
                whereClause = {
                    statut: 'publié'
                };
                if (bannedUserIds.length > 0) {
                    whereClause.AuthorId = { [Op.notIn]: bannedUserIds };
                }
            

            const stories = await db.Story.findAll({
                where: whereClause,
                include: [
                    { model: db.User, as: 'author', attributes: ['id', 'username'] },
                    { model: db.Tag, where: { status: 'approved' }, through: { attributes: [] }, required: false } // Ne montrer que les tags approuvés
                ]
            });
            return res.json(stories);
        }

    } catch (err) {
        console.error("--- ERREUR DANS getAllStories ---", err);
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// GET CURRENT USER'S STORIES
const getMyStories = async (req, res) => {
    try {
        const authorId = req.user.id;
        const stories = await db.Story.findAll({
            where: { AuthorId: authorId },
            include: [
                { 
                    model: db.User, as: 'author', attributes: ['id', 'username'] 
                },
                {
                    model: db.Tag, through: { attributes: [] } // Inclure tous les tags (approuvés ou non) pour l'auteur
                }
            ],
        });
        res.json(stories);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur lors de la récupération de vos histoires.", error: err.message });
    }
};

// GET STORY BY ID
const getStoryById = async (req, res) => {
    try {
        const story = await db.Story.findByPk(req.params.id, {
            include: [
                {
                    model: db.Page,
                    as: 'pages',
                    include: [
                        { model: db.Choice, as: 'choicesFrom' },
                    ]
                },
                { model: db.User, as: 'author' }
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
// UPDATE STORY
const updateStory = async (req, res) => {
    try {
        const story = await db.Story.findByPk(req.params.id);
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
    const t = await db.sequelize.transaction();
    try {
        const { title, description, pages, tags } = req.body;

        const story = await db.Story.findByPk(id, { transaction: t });
        if (!story) {
            await t.rollback();
            return res.status(404).json({ message: "Histoire introuvable" });
        }

        // Vérification des permissions
        if (story.AuthorId !== req.user.id && req.user.role !== 'admin') {
            await t.rollback();
            return res.status(403).json({ message: "Accès refusé" });
        }

        // Mise à jour intelligente : ne met à jour que les champs fournis
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        await story.update(updateData, { transaction: t });

        // Mise à jour des tags
        if (tags !== undefined) { // On ne met à jour que si le champ tags est présent (même un tableau vide)
            const tagInstances = await Promise.all(
                tags.map(tagName => db.Tag.findOrCreate({
                    where: { name: tagName.toLowerCase() },
                    defaults: { name: tagName.toLowerCase(), status: 'pending' },
                    transaction: t
                }).then(([tag]) => tag))
            );
            await story.setTags(tagInstances, { transaction: t });
        }

        // Si des pages sont fournies, on procède à la suppression/recréation.
        // Sinon, on ne touche à rien.
        if (pages && Array.isArray(pages)) {
            // Suppression des anciennes pages et choix
            const oldPages = await db.Page.findAll({ where: { storyId: story.id }, transaction: t });
            if (oldPages.length > 0) {
                const oldPageIds = oldPages.map(p => p.id);
                // Supprimer tous les choix liés à ces pages (source OU destination)
                await db.Choice.destroy({
                    where: { // La transaction doit être dans le même objet que 'where'
                        [Op.or]: [{ source_PageId: oldPageIds }, { next_PageId: oldPageIds }]
                    },
                    transaction: t 
                });

                await db.Page.destroy({ where: { storyId: story.id }, transaction: t });
            }

            const pageMap = [];
            for (let i = 0; i < pages.length; i++) {
                const p = await db.Page.create({
                    content: pages[i].content,
                    isEnding: pages[i].isEnding || false,
                    storyId: story.id
                }, { transaction: t });
                pageMap.push({ index: i, id: p.id, tempId: pages[i].id, isEnding: pages[i].isEnding || false });
            }

            for (let i = 0; i < pages.length; i++) {
                const pageData = pages[i];
                if (!pageMap[i].isEnding && pageData.choices && pageData.choices.length > 0) {
                    for (let choice of pageData.choices) {
                        const nextPage = pageMap.find(p => p.tempId === choice.nextPageTempId);
                        await db.Choice.create({
                            text: choice.text,
                            source_PageId: pageMap[i].id,
                            next_PageId: nextPage ? nextPage.id : null
                        }, { transaction: t });
                    }
                }
            }

            await story.update({ startPageId: pageMap.length > 0 ? pageMap[0].id : null }, { transaction: t });
        }

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
        const story = await db.Story.findByPk(req.params.id);
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
    const t = await db.sequelize.transaction();
    try {
        const { title, description, pages, tags } = req.body;

        if (!title || !pages || pages.length === 0)
            return res.status(400).json({ message: "Titre et pages obligatoires" });

        let authorId = null;
        if (req.user && req.user.id) authorId = req.user.id;
        else {
            const fallback = await db.User.findOne({ transaction: t });
            authorId = fallback ? fallback.id : null;
        }

        const story = await db.Story.create({
            title,
            description,
            AuthorId: authorId
        }, { transaction: t });

        // Gestion des tags
        if (tags && tags.length > 0) {
            const tagInstances = await Promise.all(
                tags.map(tagName => db.Tag.findOrCreate({
                    where: { name: tagName.toLowerCase() },
                    defaults: { name: tagName.toLowerCase(), status: 'pending' },
                    transaction: t
                }).then(([tag]) => tag))
            );
            await story.setTags(tagInstances, { transaction: t });
        }


        // pageMap keeps mapping between client-provided temp ids / indexes and created DB ids
        const pageMap = [];
        for (let i = 0; i < pages.length; i++) {
            const p = await db.Page.create({
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

                    await db.Choice.create({
                        text: choice.text,
                        source_PageId: pageMap[i].id,
                        next_PageId: nextPage ? nextPage.id : null
                    }, { transaction: t });
                }
            }
        }

        await story.update({ startPageId: pageMap[0].id }, { transaction: t });

        await t.commit();

        const created = await db.Story.findByPk(story.id, {
            include: [{ model: db.Page, as: 'pages', include: [{ model: db.Choice, as: 'choicesFrom' }] }]
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
        const story = await db.Story.findByPk(req.params.id);
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
        const storyIdString = req.body.storyId;
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Utilisateur non authentifié." });
        }
        const userId = req.user.id;

        if (!storyIdString) {
            return res.status(400).json({ message: "L'identifiant de l'histoire est requis." });
        }

        const storyId = parseInt(storyIdString, 10);
        // Find or create a playthrough. If it exists and is 'finished', we don't change it.
        // If it exists and is 'in_progress', we return it.
        // If it doesn't exist, we create it as 'in_progress'.
        const [playthrough, created] = await db.Playthrough.findOrCreate({
            where: { UserId: userId, StoryId: storyId },
            defaults: { EndingPageId: null, status: 'en_cours' }
        });

        if (!created && playthrough.status === 'fini') {
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
        const { storyId: storyIdString, endingPageId } = req.body;
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Utilisateur non authentifié." });
        }
        const userId = req.user.id;

        if (!storyIdString || endingPageId === undefined || endingPageId === null) { // endingPageId peut être 0, donc vérifier undefined/null
            return res.status(400).json({ message: "L'identifiant de l'histoire et de la page de fin sont requis." });
        }

        const storyId = parseInt(storyIdString, 10);
        // Try to find an existing playthrough (either in_progress or finished)
        let playthrough = await db.Playthrough.findOne({ where: { UserId: userId, StoryId: storyId } });

        if (playthrough) {
            // Update existing playthrough to 'finished'
            await playthrough.update({ EndingPageId: endingPageId, status: 'fini' });
            res.status(200).json({ message: "Partie mise à jour à 'finie'.", playthrough });
        } else {
            // If no playthrough exists (e.g., user jumped directly to an ending), create a new one as 'finished'
            playthrough = await db.Playthrough.create({
                UserId: userId,
                StoryId: storyId,
                EndingPageId: endingPageId,
                status: 'fini'
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
        console.log(`[getFullStory] Demande pour l'histoire ID: ${req.params.id}`);
        const story = await db.Story.findByPk(req.params.id, {
            include: [
                {
                    model: db.Page,
                    as: 'pages',
                    include: [
                        { model: db.Choice, as: 'choicesFrom' },
                    ]
                },
                { model: db.User, as: 'author' },
                { model: db.Tag, through: { attributes: [] } } // On inclut aussi les tags
            ]
        });

        if (!story) {
            console.log(`[getFullStory] Histoire ID: ${req.params.id} introuvable.`);
            return res.status(404).json({ message: "Story introuvable" });
        }

        // Convertir l'instance Sequelize en objet simple et s'assurer que les pages ont un tableau `choices`
        const plain = story.toJSON ? story.toJSON() : story;
        if (plain.pages && Array.isArray(plain.pages)) {
            plain.pages = plain.pages.map(p => ({
                ...p,
                // préférer `choices` existant mais se rabattre sur l'alias `choicesFrom` utilisé dans les associations
                choices: p.choices || p.choicesFrom || []
            }));
        }

        console.log(`[getFullStory] Données de l'histoire ID: ${req.params.id} envoyées avec succès.`);
        res.json(plain);
    } catch (err) {
        console.error(`[getFullStory] Erreur pour l'histoire ID: ${req.params.id}`, err);
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// SUSPEND/UNSUSPEND STORY (admin only)
const suspendStory = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès refusé. Seuls les admins peuvent suspendre une histoire." });
        }

        const story = await db.Story.findByPk(req.params.id);
        if (!story) {
            return res.status(404).json({ message: "Histoire introuvable." });
        }

        const newStatus = story.statut === 'suspendu' ? 'brouillon' : 'suspendu';
        await story.update({
            statut: newStatus
        });

        res.json({ message: `Statut de l'histoire mis à jour à '${newStatus}'.`, story: story });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur lors de la modification de la suspension.", error: err.message });
    }
};

// GET STORY STATS (lectures, fins atteintes)
const getStoryStats = async (req, res) => {
    try {
        const storyId = req.params.id;
        const userId = req.user.id;

        // Vérifier que l'histoire existe et que l'utilisateur a la permission de voir les stats
        const story = await db.Story.findByPk(storyId);
        if (!story) {
            return res.status(404).json({ message: "Histoire introuvable." });
        }
        if (story.AuthorId !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Accès refusé aux statistiques de cette histoire." });
        }

        // Compter le nombre total de lectures (parties commencées)
        const lectures = await db.Playthrough.count({
            where: { StoryId: storyId }
        });

        // Compter le nombre de fins atteintes
        const finsAtteintes = await db.Playthrough.count({
            where: { StoryId: storyId, status: 'fini' }
        });

        res.json({ lectures, finsAtteintes });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur lors de la récupération des statistiques.", error: err.message });
    }
};

// Dev helper: create a sample story with pages and choices for UI testing.

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
    suspendStory,
    startPlaythrough, // Export the new function
    getStoryStats,
};