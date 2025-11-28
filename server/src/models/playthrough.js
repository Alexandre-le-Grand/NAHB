const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Playthrough = sequelize.define('Playthrough', {
  UserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  StoryId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  EndingPageId: {
    type: DataTypes.INTEGER,
    allowNull: true 
  },
  status: {
    type: DataTypes.ENUM('en_cours', 'fini'),
    allowNull: false,
    defaultValue: 'en_cours'
  },
});

module.exports = Playthrough;