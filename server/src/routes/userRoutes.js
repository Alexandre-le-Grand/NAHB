const express = require('express');
const router = express.Router();
const db = require('../models');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyAdmin, async (req, res) => {
    try {
        const users = await db.User.findAll({ attributes: { exclude: ['password'] } });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/me/playthroughs', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const playthroughs = await db.Playthrough.findAll({
            where: { UserId: userId },
            include: [{
                model: db.Story,
                as: 'Story', // On utilise l'alias défini dans le modèle
                attributes: ['id', 'title', 'description'],
                required: false
            }]
        });
        res.json(playthroughs);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur lors de la récupération des parties jouées.", error: err.message });
    }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        await db.User.destroy({ where: { id: req.params.id } });
        res.json({ message: "Utilisateur supprimé" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id/role', verifyAdmin, async (req, res) => {
    try {
        const { role } = req.body;
        await db.User.update({ role }, { where: { id: req.params.id } });
        res.json({ message: "Rôle mis à jour" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id/ban', verifyAdmin, async (req, res) => {
    try {
        const userToUpdate = await db.User.findByPk(req.params.id);
        if (!userToUpdate) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }

        const newBanStatus = !userToUpdate.isBanned;

        await userToUpdate.update({
            isBanned: newBanStatus,
            // Si on bannit, on rétrograde. Si on débannit, le rôle reste 'user'.
            role: newBanStatus ? 'user' : userToUpdate.role
        });

        if (newBanStatus) {
            // L'utilisateur est BANNI : on sauvegarde l'état actuel et on suspend.
            const stories = await db.Story.findAll({ where: { AuthorId: req.params.id } });
            for (const story of stories) {
                if (story.statut === 'brouillon' || story.statut === 'publié') {
                    // Si le statut est valide pour la sauvegarde, on le sauvegarde et on suspend.
                    await story.update({ previousStatus: story.statut, statut: 'suspendu' });
                } else if (story.statut !== 'suspendu') {
                    // Si le statut n'est pas valide pour la sauvegarde mais n'est pas suspendu, on suspend simplement.
                    await story.update({ statut: 'suspendu' });
                }
            }
        } else {
            // L'utilisateur est DÉBANNI : on restaure l'état précédent.
            const storiesToRestore = await db.Story.findAll({ where: { AuthorId: req.params.id, statut: 'suspendu' } });
            for (const story of storiesToRestore) {
                // On restaure à l'état précédent, ou 'brouillon' par défaut si l'état précédent est null
                await story.update({
                    statut: story.previousStatus || 'brouillon'
                });
            }
        }

        // Recharger l'utilisateur depuis la BDD pour avoir les données les plus à jour
        const updatedUser = await db.User.findByPk(req.params.id);

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la modification du statut de bannissement.", error: err.message });
    }
});

module.exports = router;