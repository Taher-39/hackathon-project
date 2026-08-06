const dns = require("dns");
const mongoose = require("mongoose");

// Local resolver fails on SRV lookups for the Atlas hostname; fall back to public DNS.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function connectDB() {
  // Reuse the existing connection across warm serverless invocations instead of
  // reconnecting on every request (which exhausts MongoDB's connection limit).
  if (mongoose.connection.readyState === 1) return;

  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB connected");
}

module.exports = connectDB;
