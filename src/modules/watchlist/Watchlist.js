import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/database.js';

export const Watchlist = sequelize.define(
  'Watchlist',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'to_watch',
      validate: {
        isIn: [['to_watch', 'watched']],
      },
    },
    watchedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'watchlist',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'movieId'],
      },
    ],
  }
);
