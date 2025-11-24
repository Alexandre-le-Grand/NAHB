const { Sequelize } = require('sequelize');
require('dotenv').config();


const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: console.log, // facultatif, utile pour debug
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connexion à la base OK !');
  } catch (err) {
    console.error('Erreur de connexion :', err);
  }
})();
