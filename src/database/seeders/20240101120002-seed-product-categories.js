"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert root categories first
    await queryInterface.bulkInsert(
      "product_categories",
      [
        {
          id: 1,
          parent_id: null,
          name: "Electronics",
          slug: "electronics",
          units: "piece, set",
          status: 1,
          created_by: "admin",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          parent_id: null,
          name: "Textiles",
          slug: "textiles",
          units: "meter, piece, kg",
          status: 1,
          created_by: "admin",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 3,
          parent_id: null,
          name: "Machinery",
          slug: "machinery",
          units: "piece, set",
          status: 1,
          created_by: "admin",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 4,
          parent_id: null,
          name: "Chemicals",
          slug: "chemicals",
          units: "kg, liter, gram",
          status: 1,
          created_by: "admin",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 5,
          parent_id: null,
          name: "Food & Beverages",
          slug: "food-beverages",
          units: "kg, liter, piece, box",
          status: 1,
          created_by: "admin",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );

    // Insert child categories
    await queryInterface.bulkInsert(
      "product_categories",
      [
        {
          parent_id: 1,
          name: "Mobile Phones",
          slug: "mobile-phones",
          units: "piece",
          status: 1,
          created_by: "admin",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          parent_id: 1,
          name: "Computers",
          slug: "computers",
          units: "piece, set",
          status: 1,
          created_by: "admin",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          parent_id: 2,
          name: "Cotton Fabric",
          slug: "cotton-fabric",
          units: "meter, kg",
          status: 1,
          created_by: "admin",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          parent_id: 2,
          name: "Garments",
          slug: "garments",
          units: "piece, dozen",
          status: 1,
          created_by: "admin",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          parent_id: 3,
          name: "Industrial Machinery",
          slug: "industrial-machinery",
          units: "piece, set",
          status: 1,
          created_by: "admin",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("product_categories", null, {});
  },
};
