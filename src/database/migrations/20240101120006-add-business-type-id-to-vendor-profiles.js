'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('vendor_profiles', 'business_type_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'business_types',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for performance
    await queryInterface.addIndex('vendor_profiles', ['business_type_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('vendor_profiles', 'business_type_id');
  }
};