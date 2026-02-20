'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('todos', 'important', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addIndex('todos', ['important']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('todos', ['important']);
    await queryInterface.removeColumn('todos', 'important');
  },
};
