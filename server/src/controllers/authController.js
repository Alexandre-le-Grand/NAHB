const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, email, password, role } = req.body; // rôle optionnel
        const salt = await bcrypt.genSalt(10);

        const isRegistered = await User.findOne({ where: { email } });
        if (isRegistered) return res.status(400).json({ message: "Email déjà utilisé" });

        const hashedPassword = await bcrypt.hash(password, salt);

        // role par défaut = 'user' si non fourni
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            role: role || 'user'
        });

        res.status(201).json({ message: "Utilisateur créé avec succès !", userId: newUser.id });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de l'inscription", error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) return res.status(400).json({ message: "Email ou mot de passe incorrect" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Email ou mot de passe incorrect" });

        // Assurer que le rôle est défini et non null
        const role = user.role || 'user';

        // Génération token JWT
        const token = jwt.sign(
            { id: user.id, role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: "Connexion réussie",
            token,
            user: { id: user.id, username: user.username, role }
        });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};


exports.me = async (req, res) => {
    try {
        // req.user est défini par verifyToken
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'username', 'email', 'role']
        });
        if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};