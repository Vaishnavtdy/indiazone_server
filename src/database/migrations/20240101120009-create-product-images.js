'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_images', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      product_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      image_url: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      alt_text: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      file_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      created_by: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      updated_by: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
    await queryInterface.addIndex('product_images', ['product_id']);
    await queryInterface.addIndex('product_images', ['is_primary']);
    await queryInterface.addIndex('product_images', ['sort_order']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product_images');
  }
};