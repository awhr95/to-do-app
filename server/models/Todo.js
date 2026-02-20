import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const Todo = sequelize.define('Todo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('new', 'working', 'complete'),
      allowNull: false,
      defaultValue: 'new',
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    important: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    tableName: 'todos',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  });

  return Todo;
}
