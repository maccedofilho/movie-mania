import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const Like = sequelize.define(
  'Like',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
  },
  {
    tableName: 'likes',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'movieId'],
      },
    ],
  }
);
