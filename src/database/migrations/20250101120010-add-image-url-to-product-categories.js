'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('product_categories', 'image_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add index for performance
    await queryInterface.addIndex('product_categories', ['image_url']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('product_categories', 'image_url');
  }
};