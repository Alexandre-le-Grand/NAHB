const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')
const User = require('./User')

const Story = sequelize.define('Story', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  AuthorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  startPageId: {
    type: DataTypes.INTEGER
  }
}, {
  freezeTableName: true,
  timestamps: false
})

module.exports = Story
