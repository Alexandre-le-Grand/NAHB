const Story = require('./Story');
const Page = require('./Page');
const Choice = require('./Choice');
const User = require('./User');
const Playthrough = require('./playthrough');

// Story - Page
Story.hasMany(Page, { as: 'pages', foreignKey: 'storyId' });
Page.belongsTo(Story, { foreignKey: 'storyId' });

// Page - Choice
Page.hasMany(Choice, { as: 'choicesFrom', foreignKey: 'source_PageId' });

// Choice - Page
Choice.belongsTo(Page, { as: 'sourcePage', foreignKey: 'source_PageId' });
Choice.belongsTo(Page, { as: 'nextPage', foreignKey: 'next_PageId' });

// Optionnel : User - Story
User.hasMany(Story, { foreignKey: 'AuthorId' });
Story.belongsTo(User, { foreignKey: 'AuthorId', as: 'author' });

// Playthrough associations
User.hasMany(Playthrough, { foreignKey: 'UserId' });
Playthrough.belongsTo(User, { foreignKey: 'UserId' });

Story.hasMany(Playthrough, { foreignKey: 'StoryId' });
Playthrough.belongsTo(Story, { foreignKey: 'StoryId' });

Playthrough.belongsTo(Page, { foreignKey: 'EndingPageId' });

module.exports = {
  Story,
  Page,
  Choice,
  User,
  Playthrough
};
