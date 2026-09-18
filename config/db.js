// makan-backend/config/db.js
const mongoose = require('mongoose');
const dns = require('dns');

// Force IPv4 resolution order and set reliable public DNS servers for Atlas SRV lookups
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if not supported in environment
}

// Print all executed Mongoose operations to console
mongoose.set('debug', true);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB Connection Error Details:');
    console.error(error); // Logs full stack trace, underlying cause, and nested properties
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;