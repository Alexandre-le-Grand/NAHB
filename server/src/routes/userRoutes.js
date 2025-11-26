const express = require('express');
const router = express.Router();
const { User, Playthrough, Story } = require('../models');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyAdmin, async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Nouvelle route pour récupérer les histoires jouées par l'utilisateur connecté
router.get('/me/playthroughs', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const playthroughs = await Playthrough.findAll({
            where: { UserId: userId },
            include: [{
                model: Story, // On inclut l'histoire pour le profil
                attributes: ['id', 'title', 'description'],
                required: false // Utilise LEFT JOIN, pour ne pas planter si l'histoire liée n'existe plus
            }],
        });
        res.json(playthroughs);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur lors de la récupération des parties jouées.", error: err.message });
    }
});

router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        await User.destroy({ where: { id: req.params.id } });
        res.json({ message: "Utilisateur supprimé" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id/role', verifyAdmin, async (req, res) => {
    try {
        const { role } = req.body; // on attend { role: 'admin' } ou { role: 'user' }
        await User.update({ role }, { where: { id: req.params.id } });
        res.json({ message: "Rôle mis à jour" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;