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
    username: process.env.MYSQLUSER, // 'root'
    password: process.env.MYSQL_ROOT_PASSWORD, // <-- fix this
    database: process.env.MYSQL_DATABASE, // 'railway'
    host: process.env.MYSQLHOST, // 'mysql.railway.internal'
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
