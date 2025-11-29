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
                attributes: ['id', 'title', 'description'],
                required: false
            }],
            order: [['updatedAt', 'DESC']]
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

        res.json(userToUpdate);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la modification du statut de bannissement.", error: err.message });
    }
});

module.exports = router;