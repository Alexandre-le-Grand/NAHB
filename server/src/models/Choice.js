const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')
const Page = require('./Page')

const Choice = sequelize.define('Choice', {
  text: {
    type: DataTypes.STRING,
    allowNull: false
  },
  source_PageId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  next_PageId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  freezeTableName: true,
  timestamps: false
})



module.exports = Choice
