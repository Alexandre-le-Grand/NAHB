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
    allowNull: true // Peut être null si la partie est "en_cours"
  },
  status: {
    type: DataTypes.ENUM('in_progress', 'finished'),
    allowNull: false,
    defaultValue: 'in_progress'
  },
});

module.exports = Playthrough;