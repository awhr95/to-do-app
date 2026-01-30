'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('todos', 'projectId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('todos', ['projectId']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('todos', 'projectId');
  },
};
