'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('business_types', [
      {
        business_type: 'Manufacturing',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        business_type: 'Trading',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        business_type: 'Service Provider',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        business_type: 'Distributor',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        business_type: 'Wholesaler',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        business_type: 'Retailer',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        business_type: 'Exporter',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        business_type: 'Importer',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        business_type: 'Technology',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        business_type: 'Consultant',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('business_types', null, {});
  }
};