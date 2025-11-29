require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./src/config/db');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const storyRoutes = require('./src/routes/storyRoutes');

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

app.get('/', (req, res) => {
    res.send("API OK 🚀");
});

sequelize.sync({ force: false })
    .then(() => {
        console.log("✅ DB synchronisée");
        app.listen(PORT, () => console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`));
    })
    .catch(err => console.log("❌ Erreur DB :", err));
