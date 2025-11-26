const Story = require('./Story');
const Page = require('./Page');
const Choice = require('./Choice');
const User = require('./User');

// Story - Page
Story.hasMany(Page, { as: 'pages', foreignKey: 'storyId' });
Page.belongsTo(Story, { foreignKey: 'storyId' });

// Page - Choice
Page.hasMany(Choice, { as: 'choicesFrom', foreignKey: 'source_PageId' });
Page.hasMany(Choice, { as: 'choicesTo', foreignKey: 'next_PageId' });

// Choice - Page
Choice.belongsTo(Page, { as: 'sourcePage', foreignKey: 'source_PageId' });
Choice.belongsTo(Page, { as: 'nextPage', foreignKey: 'next_PageId' });

// Optionnel : User - Story
User.hasMany(Story, { foreignKey: 'AuthorId' });
Story.belongsTo(User, { foreignKey: 'AuthorId', as: 'author' });

module.exports = {
  Story,
  Page,
  Choice,
  User
};
