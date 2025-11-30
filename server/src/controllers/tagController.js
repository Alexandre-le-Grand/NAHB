const db = require('../models/index');

// Lister tous les tags (pour l'admin)
exports.getAllTags = async (req, res) => {
    try {
        const tags = await db.Tag.findAll({ order: [['status', 'ASC'], ['name', 'ASC']] });
        res.json(tags);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// Approuver un tag
exports.approveTag = async (req, res) => {
    try {
        const tag = await db.Tag.findByPk(req.params.id);
        if (!tag) return res.status(404).json({ message: "Tag introuvable" });
        await tag.update({ status: 'approved' });
        res.json(tag);
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};

// Supprimer un tag
exports.deleteTag = async (req, res) => {
    try {
        const tag = await db.Tag.findByPk(req.params.id);
        if (!tag) return res.status(404).json({ message: "Tag introuvable" });
        await tag.destroy();
        res.json({ message: "Tag supprimé" });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
};