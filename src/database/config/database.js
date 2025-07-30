require("dotenv").config();
const useSSL = process.env.DATABASE_SSL === "true";

module.exports = {
  development: {
    dialect: "postgres",
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    logging: console.log,
    dialectOptions: useSSL
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false, // you can set this to true in production with a proper CA
          },
        }
      : {},
  },
  test: {
    dialect: "postgres",
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    logging: false,
  },
  production: {
    dialect: "postgres",
    host: process.env.DATABASE_HOST,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    logging: false,
    dialectOptions: useSSL
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false, // you can set this to true in production with a proper CA
          },
        }
      : {},
  },
};
