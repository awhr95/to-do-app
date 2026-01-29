import { Sequelize } from 'sequelize';
import config from '../config/database.js';
import UserModel from './User.js';
import TodoModel from './Todo.js';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
  }
);

const User = UserModel(sequelize);
const Todo = TodoModel(sequelize);

// Associations
User.hasMany(Todo, { foreignKey: 'userId', as: 'todos' });
Todo.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { sequelize, User, Todo };
