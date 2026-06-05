import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const MovieActor = sequelize.define(
  'MovieActor',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    characterName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'movie_actors',
    timestamps: true,
  }
);
