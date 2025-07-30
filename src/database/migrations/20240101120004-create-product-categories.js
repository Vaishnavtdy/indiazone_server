'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_categories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'product_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: false
      },
      units: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      status: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        comment: '0 = pending, 1 = approved'
      },
      created_by: {
        type: Sequelize.ENUM('admin', 'vendor'),
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
    await queryInterface.addIndex('product_categories', ['parent_id']);
    await queryInterface.addIndex('product_categories', ['name']);
    await queryInterface.addIndex('product_categories', ['slug']);
    await queryInterface.addIndex('product_categories', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product_categories');
  }
};