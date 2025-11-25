const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    
    if (!token) return res.status(401).json({ message: "Accès refusé" });

    try {
        const tokenClean = token.replace('Bearer ', '');
        const verified = jwt.verify(tokenClean, 'SECRET_KEY_A_CHANGER'); 
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: "Token invalide" });
    }
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: "Accès interdit : Vous n'êtes pas administrateur." });
        }
    });
};

module.exports = { verifyToken, verifyAdmin };