require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const storyRoutes = require('./src/routes/storyRoutes');
const pageRoutes = require('./src/routes/pageRoutes');
const choiceRoutes = require('./src/routes/choiceRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELETE,PATCH",
    credentials: true
}));app.use(express.json());

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/stories', storyRoutes);
app.use('/pages', pageRoutes);
app.use('/choices', choiceRoutes);

app.get('/', (req, res) => {
    res.send("API OK 🚀");
});

// sequelize.sync({ force: false }) // Ne modifie pas les tables existantes
// sequelize.sync({ force: true }) // Supprime et recrée les tables (perd les données)
// Utiliser { alter: true } en développement pour synchroniser les changements de modèle
// sans perdre les données.
sequelize.sync({ alter: true })
    .then(() => {
        console.log("✅ DB synchronisée");
        app.listen(PORT, () => console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`));
    })
    .catch(err => console.log("❌ Erreur DB :", err));
