const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const Page = sequelize.define('Page', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isEnding: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  storyId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  freezeTableName: true,
  timestamps: false
})

module.exports = Page
