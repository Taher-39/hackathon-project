require("dotenv").config();
const app = require("../src/app");
const connectDB = require("../src/config/db");

module.exports = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("Failed to connect to MongoDB", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, message: "Database connection failed" }));
    return;
  }
  app(req, res);
};
