require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./src/config/db'); // Import de la config DB
const authRoutes = require('./src/routes/authRoutes'); // Import des routes

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);

// Route Test
app.get('/', (req, res) => {
    res.send('API NAHB en ligne');
});

// Connexion DB et Lancement
const PORT = process.env.PORT || 5000;

// sequelize.sync() va créer les tables dans MySQL si elles n'existent pas !
// { force: false } évite d'effacer les données à chaque redémarrage
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