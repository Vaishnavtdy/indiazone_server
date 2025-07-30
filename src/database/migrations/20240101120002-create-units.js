"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("units", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      unit_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      status: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        comment: "0 = pending, 1 = approved",
      },
      created_by: {
        type: Sequelize.ENUM("admin"),
        allowNull: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex("units", ["unit_name"]);
    await queryInterface.addIndex("units", ["status"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("units");
  },
};
