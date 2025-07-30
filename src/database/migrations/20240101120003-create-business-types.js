'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('business_types', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      business_type: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      status: {
        type: Sequelize.BIGINT,
        defaultValue: 1,
        comment: '0 = Inactive, 1 = Active'
      },
      created_by: {
        type: Sequelize.ENUM('admin'),
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('business_types', ['business_type']);
    await queryInterface.addIndex('business_types', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('business_types');
  }
};