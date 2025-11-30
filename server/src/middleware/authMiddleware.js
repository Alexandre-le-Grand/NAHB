const jwt = require('jsonwebtoken');
const db = require('../models/index');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: "Accès refusé : Token manquant" });
    }

    const token = authHeader.split(' ')[1]?.trim();
    if (!token) return res.status(401).json({ message: "Token manquant après Bearer" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Token invalide" });
    }
};

// Middleware admin clean
const verifyAdmin = (req, res, next) => {
    // d'abord vérifier le token
    verifyToken(req, res, (err) => {
        if (err) return next(err);
        if (req.user?.role === 'admin') {
            return next();
        } else {
            return res.status(403).json({ message: "Accès interdit : Vous n'êtes pas administrateur." });
        }
    });
};

const verifyAdminOrAuthor = (req, res, next) => {
    verifyToken(req, res, (err) => {
        if (err) return next(err);
        if (req.user?.role === 'admin' || req.user?.role === 'author') {
            return next();
        } else {
            return res.status(403).json({ message: "Accès interdit : Vous devez être administrateur ou auteur." });
        }
    });
};

const verifyAdminOrStoryAuthor = async (req, res, next) => {
    verifyToken(req, res, async (err) => {
        if (err) return next(err);

        if (req.user?.role === 'admin') {
            return next(); // L'admin a tous les droits
        }

        try {
            const story = await db.Story.findByPk(req.params.id);
            if (!story) return res.status(404).json({ message: "Histoire introuvable." });

            if (story.AuthorId === req.user.id) {
                return next(); // C'est bien l'auteur de l'histoire
            }
            return res.status(403).json({ message: "Accès refusé : Vous n'êtes pas l'auteur de cette histoire." });
        } catch (error) {
            return res.status(500).json({ message: "Erreur serveur lors de la vérification des droits." });
        }
    });
};

module.exports = { verifyToken, verifyAdmin, verifyAdminOrAuthor, verifyAdminOrStoryAuthor };
