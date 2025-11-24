require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./src/config/db'); // Import de la config DB
const authRoutes = require('./src/routes/authRoutes'); // Import des routes d'authentification
const User = require('./src/models/User'); // Import du modèle User

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares ---
app.use(express.json()); // Pour lire le JSON dans req.body
app.use(cors()); // Pour autoriser le frontend React à parler au backend

// --- Routes Principales ---
// IMPORTANT : J'ai mis '/api' ici pour correspondre à ton frontend 
// (http://localhost:5000/api/register)
app.use('/api', authRoutes);


// --- Routes de Test (Optionnelles) ---
// Ces routes servent juste à vérifier le contenu de ta table rapidement

// Récupérer tous les utilisateurs
app.get('/users', async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Créer un utilisateur MANUELLEMENT (Attention: mot de passe non crypté ici !)
// Pour une vraie inscription, utilise plutôt la route /api/register
app.post('/users', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const newUser = await User.create({ username, email, password, role });
        res.json(newUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- Connexion DB et Lancement du Serveur ---

// force: false = ne pas effacer les tables à chaque redémarrage
sequelize.sync({ force: false })
    .then(() => {
        console.log('✅ Base de données synchronisée');
        app.listen(PORT, () => {
            console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Erreur de synchro DB :', err);
    });