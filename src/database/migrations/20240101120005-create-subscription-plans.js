'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subscription_plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      product_limit: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rfq_limit: {
        type: Sequelize.ENUM('Limited', 'Medium', 'Unlimited', 'As Per Priority'),
        allowNull: false
      },
      search_visibility: {
        type: Sequelize.ENUM('Normal', 'Enhanced', 'Top', 'Sector Priority'),
        allowNull: false
      },
      micro_fair_priority: {
        type: Sequelize.ENUM('None', 'Medium', 'High', 'Sector Priority'),
        allowNull: false
      },
      trust_badge: {
        type: Sequelize.ENUM('Not Included', 'Included', 'Mandatory'),
        allowNull: false
      },
      verification: {
        type: Sequelize.ENUM('Included', 'Strict'),
        allowNull: false
      },
      profile_page_type: {
        type: Sequelize.ENUM('Basic', 'Advanced', 'Fully Customized'),
        allowNull: false
      },
      pdf_brochure: {
        type: Sequelize.ENUM('Not Available', 'Viewable', 'Downloadable'),
        allowNull: false
      },
      video_access: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      whatsapp_chat: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      ai_agent: {
        type: Sequelize.ENUM('Not Available', 'Available', 'Included'),
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      duration_in_days: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      rfq_limited_vendor_count: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rfq_medium_vendor_count: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rfq_high_vendor_count: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true
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
    await queryInterface.addIndex('subscription_plans', ['name']);
    await queryInterface.addIndex('subscription_plans', ['status']);
    await queryInterface.addIndex('subscription_plans', ['price']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subscription_plans');
  }
};