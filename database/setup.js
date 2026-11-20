require('dotenv').config();
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Environment-specific database configuration
const config = {
  development: {
    storage: path.join(__dirname, '..', process.env.DEV_DB_PATH || 'database/music_library.db'),
    logging: false
  },
  production: {
    storage: path.join(__dirname, '..', process.env.PROD_DB_PATH || 'database/music_library_prod.db'),
    logging: false
  }
};

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  ...config[env]
});

// Track model
const Track = sequelize.define(
  'Track',
  {
    trackId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    songTitle: { type: DataTypes.STRING, allowNull: false },
    artistName: { type: DataTypes.STRING, allowNull: false },
    albumName: { type: DataTypes.STRING, allowNull: false },
    genre: { type: DataTypes.STRING, allowNull: false },
    duration: { type: DataTypes.INTEGER, allowNull: false }, // seconds
    releaseYear: { type: DataTypes.INTEGER, allowNull: false }
  },
  {
    tableName: 'tracks',
    timestamps: false
  }
);

async function setupDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    await sequelize.sync();
    console.log(`Database and tables created successfully (${env}).`);
  } catch (error) {
    console.error('Unable to set up the database:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

// Only run setup when executed directly (node database/setup.js)
if (require.main === module) {
  setupDatabase();
}

module.exports = { sequelize, Track };
