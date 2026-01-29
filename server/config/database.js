import "dotenv/config";

const getEnv = (railwayVar, localVar) =>
  process.env[railwayVar] || process.env[localVar];

const config = {
  development: {
    username: getEnv("MYSQLUSER", "DB_USER") || "root",
    password: getEnv("MYSQLPASSWORD", "DB_PASSWORD") || "",
    database: getEnv("MYSQLDATABASE", "DB_NAME") || "donext_dev",
    host: getEnv("MYSQLHOST", "DB_HOST") || "127.0.0.1",
    port: getEnv("MYSQLPORT", "DB_PORT") || 3306,
    dialect: "mysql",
    logging: false,
  },

  test: {
    username: getEnv("MYSQLUSER", "DB_USER") || "root",
    password: getEnv("MYSQLPASSWORD", "DB_PASSWORD") || "",
    database: getEnv("MYSQLDATABASE", "DB_NAME") || "donext_test",
    host: getEnv("MYSQLHOST", "DB_HOST") || "127.0.0.1",
    port: getEnv("MYSQLPORT", "DB_PORT") || 3306,
    dialect: "mysql",
    logging: false,
  },

  production: {
    username: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT || 3306,
    dialect: "mysql",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};

export default config;
