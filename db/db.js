// Import Sequelize and database connection
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize(
  process.env.DB_NAME || "ecom",
  process.env.DB_USER_NAME || "admin",
  process.env.DB_PASSWORD || "admin@123",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  }
);

// Define the Product model
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    total_amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue :0
    },
    parent_id: {
      type: DataTypes.INTEGER,
      defaultValue : null
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
  },
  {
    tableName: "users",
    timestamps: false,
  }
);



(async () => {
  try {
    await sequelize.sync({ force: false });
    console.log("Database synchronized");
  } catch (error) {
    console.error("Error synchronizing database:", error);
  }
})();

// Export the Product model
module.exports = {  User};
