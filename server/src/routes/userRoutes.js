const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyAdmin, async (req, res) => {
    try {
        const users = await User.findAll({ attributes: { exclude: ['password'] } });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
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