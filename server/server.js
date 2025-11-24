const { Sequelize } = require('sequelize');
const express = require('express');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: console.log,
  }
);

const app = express();
app.get('/', (req, res) => {
    res.send('Serveur NAHB est en marche !');
});

const PORT = process.env.SERVER_PORT || 3000; 

(async () => {
  try {
    // 1. Connexion à la base de données
    await sequelize.authenticate();
    console.log('Connexion à la base OK !');

    app.listen(PORT, () => {
      console.log(`Serveur Express en écoute sur le port ${PORT}`);
      console.log(`URL locale : http://localhost:${PORT}`);
    });
    
  } catch (err) {
    console.error('Erreur de connexion OU de démarrage du serveur :', err);
  }
})();