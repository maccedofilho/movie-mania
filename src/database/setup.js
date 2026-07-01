import { sequelize } from '../config/database.js';
import { User } from '../modules/user/User.js';
import { Movie } from '../modules/movie/Movie.js';
import { Genre } from '../modules/genre/Genre.js';
import { Director } from '../modules/director/Director.js';
import { Actor } from '../modules/actor/Actor.js';
import { Review } from '../modules/review/Review.js';
import { MovieActor } from '../modules/movie/MovieActor.js';
import { Like } from '../modules/like/Like.js';
import { Watchlist } from '../modules/watchlist/Watchlist.js';

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

User.hasMany(Watchlist, { foreignKey: 'userId' });
Watchlist.belongsTo(User, { foreignKey: 'userId' });
Movie.hasMany(Watchlist, { foreignKey: 'movieId' });
Watchlist.belongsTo(Movie, { foreignKey: 'movieId' });

await sequelize.sync();

if (process.env.NODE_ENV !== 'test') {
  await User.findOrCreate({
    where: { email: 'demo@moviemania.local' },
    defaults: {
      name: 'Demo',
      email: 'demo@moviemania.local',
      password: 'demo-hash',
    },
  });
}

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
  Watchlist,
};
