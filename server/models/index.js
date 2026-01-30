import { Sequelize } from 'sequelize';
import config from '../config/database.js';
import UserModel from './User.js';
import TodoModel from './Todo.js';
import ProjectModel from './Project.js';

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
const Project = ProjectModel(sequelize);

// Associations
User.hasMany(Todo, { foreignKey: 'userId', as: 'todos' });
Todo.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Project, { foreignKey: 'userId', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.hasMany(Todo, { foreignKey: 'projectId', as: 'todos' });
Todo.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

export { sequelize, User, Todo, Project };
