import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const Project = sequelize.define('Project', {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    mode: {
      type: DataTypes.ENUM('work', 'life'),
      allowNull: false,
      defaultValue: 'work',
    },
  }, {
    tableName: 'projects',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  });

  return Project;
}
