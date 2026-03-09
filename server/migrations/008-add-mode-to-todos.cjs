'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('todos', 'mode', {
      type: Sequelize.ENUM('work', 'life'),
      allowNull: false,
      defaultValue: 'work',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('todos', 'mode');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_todos_mode";');
  }
};
