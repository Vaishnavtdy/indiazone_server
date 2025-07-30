"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, get some existing data for foreign keys
    // const users = await queryInterface.sequelize.query(
    //   "SELECT id FROM users WHERE type id = 9",
    //   { type: Sequelize.QueryTypes.SELECT }
    // );

    const categories = await queryInterface.sequelize.query(
      "SELECT id FROM product_categories WHERE status = 1 LIMIT 5",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const units = await queryInterface.sequelize.query(
      "SELECT id FROM units WHERE status = 1 LIMIT 3",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (categories.length === 0 || units.length === 0) {
      console.log("Skipping product seeding - required data not found");
      return;
    }

    // Insert sample products
    await queryInterface.bulkInsert(
      "products",
      [
        {
          client_id: 9,
          category_id: categories[0].id,
          unit_id: units[0].id,
          name: "Premium Cotton T-Shirt",
          slug: `premium-cotton-t-shirt-${9}`,
          short_description:
            "Comfortable premium cotton t-shirt for everyday wear",
          description:
            "This premium cotton t-shirt offers exceptional comfort and durability. Made from 100% organic cotton, it features a classic fit and is perfect for casual occasions.",
          specification:
            "Material: 100% Organic Cotton, Weight: 180gsm, Care: Machine washable",
          status: "active",
          
          created_by: 9,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          client_id: 9,
          category_id: categories[1].id,
          unit_id: units[1].id,
          name: "Wireless Bluetooth Headphones",
          slug: `wireless-bluetooth-headphones-${9}`,
          short_description:
            "High-quality wireless headphones with noise cancellation",
          description:
            "Experience superior sound quality with these wireless Bluetooth headphones. Features active noise cancellation, 30-hour battery life, and premium comfort.",
          specification:
            "Bluetooth 5.0, 30hr battery, Active noise cancellation, 40mm drivers",
          status: "active",
          created_by: 9,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          client_id: 9,
          category_id: categories[2].id,
          unit_id: units[2].id,
          name: "Stainless Steel Water Bottle",
          slug: `stainless-steel-water-bottle-${9}`,
          short_description: "Insulated stainless steel water bottle",
          description:
            "Keep your drinks at the perfect temperature with this double-wall insulated stainless steel water bottle. BPA-free and eco-friendly.",
          specification:
            "Capacity: 750ml, Material: 304 Stainless Steel, Insulation: Double-wall vacuum",
          status: "active",
          created_by: 9,
          created_at: new Date(),
          updated_at: new Date(),
        },
        // {
        //   client_id: users[1].id,
        //   category_id: categories[3].id,
        //   unit_id: units[0].id,
        //   name: "Organic Green Tea",
        //   slug: `organic-green-tea-${users[1].id}`,
        //   short_description: "Premium organic green tea leaves",
        //   description:
        //     "Enjoy the health benefits of our premium organic green tea. Sourced from high-altitude gardens and carefully processed to preserve natural antioxidants.",
        //   specification:
        //     "Origin: Himalayan gardens, Processing: Traditional, Caffeine: Medium, Antioxidants: High",
        //   status: "active",
        //   created_by: users[1].id,
        //   created_at: new Date(),
        //   updated_at: new Date(),
        // },
        // {
        //   client_id: users[2].id,
        //   category_id: categories[4].id,
        //   unit_id: units[1].id,
        //   name: "Smart Fitness Tracker",
        //   slug: `smart-fitness-tracker-${users[2].id}`,
        //   short_description:
        //     "Advanced fitness tracker with heart rate monitoring",
        //   description:
        //     "Track your fitness goals with this advanced smart fitness tracker. Features heart rate monitoring, sleep tracking, and smartphone notifications.",
        //   specification:
        //     'Display: 1.4" AMOLED, Battery: 7 days, Water resistance: 5ATM, Sensors: Heart rate, GPS',
        //   status: "draft",
        //   created_by: users[2].id,
        //   created_at: new Date(),
        //   updated_at: new Date(),
        // },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("products", null, {});
  },
};
