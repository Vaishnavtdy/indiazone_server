'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('vendor_profiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      business_type: {
        type: Sequelize.STRING,
        allowNull: true
      },
      business_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      company_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contact_person: {
        type: Sequelize.STRING,
        allowNull: true
      },
      designation: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      website: {
        type: Sequelize.STRING,
        allowNull: true
      },
      business_registration_certificate: {
        type: Sequelize.STRING,
        allowNull: true
      },
      gst_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      company_details: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      whatsapp_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      logo: {
        type: Sequelize.STRING,
        allowNull: true
      },
      working_days: {
        type: Sequelize.STRING,
        allowNull: true
      },
      employee_count: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      payment_mode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      establishment: {
        type: Sequelize.INTEGER,
        allowNull: true
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
    await queryInterface.addIndex('vendor_profiles', ['user_id']);
    await queryInterface.addIndex('vendor_profiles', ['business_type']);
    await queryInterface.addIndex('vendor_profiles', ['company_name']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('vendor_profiles');
  }
};