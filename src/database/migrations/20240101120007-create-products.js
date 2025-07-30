"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("products", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT,
      },
      client_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      category_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "product_categories",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      unit_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "units",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      short_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT("long"),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("draft", "active", "inactive", "discontinued"),
        defaultValue: "draft",
      },
      created_by: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      updated_by: {
        type: Sequelize.BIGINT,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
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
    await queryInterface.addIndex("products", ["client_id"]);
    await queryInterface.addIndex("products", ["category_id"]);
    await queryInterface.addIndex("products", ["unit_id"]);
    await queryInterface.addIndex("products", ["status"]);
    await queryInterface.addIndex("products", ["name"]);
    await queryInterface.addIndex("products", ["slug", "client_id"], {
      unique: true,
    });
    await queryInterface.addIndex("products", ["created_at"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("products");
  },
};
