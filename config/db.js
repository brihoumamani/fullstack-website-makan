// makan-backend/config/db.js
const mongoose = require('mongoose');

// Print all executed Mongoose operations to console in development
if (process.env.NODE_ENV !== 'production') {
  mongoose.set('debug', true);
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('CRITICAL: MONGO_URI is not defined in environment variables!');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB Connection Error Details:');
    console.error(error.message);
  }
};

module.exports = connectDB;