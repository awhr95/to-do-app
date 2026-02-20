'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add position column
    await queryInterface.addColumn('todos', 'position', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Backfill position based on createdAt order within each status group
    // Using raw SQL for efficient bulk update
    await queryInterface.sequelize.query(`
      UPDATE todos t
      JOIN (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY status ORDER BY createdAt ASC) - 1 AS new_position
        FROM todos
      ) ranked ON t.id = ranked.id
      SET t.position = ranked.new_position
    `);

    // Now make it non-nullable with default 0
    await queryInterface.changeColumn('todos', 'position', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    // Add index for efficient ordering queries
    await queryInterface.addIndex('todos', ['status', 'position']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('todos', ['status', 'position']);
    await queryInterface.removeColumn('todos', 'position');
  },
};
