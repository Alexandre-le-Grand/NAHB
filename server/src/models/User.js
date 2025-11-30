const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user','author','admin'),
    defaultValue: 'user'
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  freezeTableName: true,
  timestamps: false
})

module.exports = User
