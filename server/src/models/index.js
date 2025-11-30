const Story = require('./Story');
const Page = require('./Page');
const Choice = require('./Choice');
const User = require('./User');
const Playthrough = require('./playthrough'); // Correction du nom de fichier si nécessaire
const Tag = require('./Tag'); // Importer le nouveau modèle Tag
const sequelize = require('../config/db'); // Correction du chemin d'importation

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
Playthrough.belongsTo(Story, { as: 'Story', foreignKey: 'StoryId' }); // Ajout de l'alias 'Story'

Playthrough.belongsTo(Page, { foreignKey: 'EndingPageId' });

// Story - Tag (Many-to-Many)
const StoryTag = sequelize.define('StoryTag', {}, { timestamps: false });
Story.belongsToMany(Tag, { through: StoryTag });
Tag.belongsToMany(Story, { through: StoryTag });

module.exports = {
  Story,
  Page,
  Choice,
  User,
  Playthrough,
  Tag, // Exporter le modèle Tag
  StoryTag, // Exporter la table de liaison
  sequelize // Exporter l'instance sequelize
};
