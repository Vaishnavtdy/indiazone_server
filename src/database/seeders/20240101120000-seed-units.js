'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('units', [
      {
        unit_name: 'Piece',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        unit_name: 'Kilogram',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        unit_name: 'Gram',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        unit_name: 'Meter',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        unit_name: 'Centimeter',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        unit_name: 'Liter',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        unit_name: 'Milliliter',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        unit_name: 'Box',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        unit_name: 'Dozen',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        unit_name: 'Set',
        status: 1,
        created_by: 'admin',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('units', null, {});
  }
};