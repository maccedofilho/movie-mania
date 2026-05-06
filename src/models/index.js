import { sequelize } from '../config/database.js';
import { User } from './User.js';
import { Movie } from './Movie.js';
import { Genre } from './Genre.js';
import { Director } from './Director.js';
import { Actor } from './Actor.js';
import { Review } from './Review.js';
import { MovieActor } from './MovieActor.js';
import { Like } from './Like.js';

Genre.hasMany(Movie, { foreignKey: 'genreId' });
Movie.belongsTo(Genre, { foreignKey: 'genreId' });

Director.hasMany(Movie, { foreignKey: 'directorId' });
Movie.belongsTo(Director, { foreignKey: 'directorId' });

Movie.belongsToMany(Actor, { through: MovieActor, foreignKey: 'movieId' });
Actor.belongsToMany(Movie, { through: MovieActor, foreignKey: 'actorId' });

User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId' });
Movie.hasMany(Review, { foreignKey: 'movieId' });
Review.belongsTo(Movie, { foreignKey: 'movieId' });

User.belongsToMany(Movie, { through: Like, foreignKey: 'userId', as: 'LikedMovies' });
Movie.belongsToMany(User, { through: Like, foreignKey: 'movieId', as: 'LikedBy' });

await sequelize.sync();

export {
  sequelize,
  User,
  Movie,
  Genre,
  Director,
  Actor,
  Review,
  MovieActor,
  Like,
};
