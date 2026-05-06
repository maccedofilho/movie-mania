import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Actor = sequelize.define(
  'Actor',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    birthYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'actors',
    timestamps: true,
  }
);
