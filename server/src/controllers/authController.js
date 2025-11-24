const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;


        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Créer l'utilisateur
        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        res.status(201).json({ message: "Utilisateur créé avec succès !", userId: newUser.id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de l'inscription", error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: "Email ou mot de passe incorrect" });
        }

        // 2. Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Email ou mot de passe incorrect" });
        }

        // 3. Générer le Token JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' } // Expire dans 1 jour
        );

        res.json({
            message: "Connexion réussie",
            token,
            user: { id: user.id, username: user.username, role: user.role }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};