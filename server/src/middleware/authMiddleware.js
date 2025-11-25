const jwt = require('jsonwebtoken');

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

module.exports = { verifyToken, verifyAdmin };
