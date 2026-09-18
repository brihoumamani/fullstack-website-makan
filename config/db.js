// makan-backend/config/db.js
const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb://amany_DB:SkRcN24ncL6vZxz4@ac-bxp3skd-shard-00-00.jmiv0ty.mongodb.net:27017,ac-bxp3skd-shard-00-01.jmiv0ty.mongodb.net:27017,ac-bxp3skd-shard-00-02.jmiv0ty.mongodb.net:27017/makan?ssl=true&authSource=admin&retryWrites=true&w=majority';

const connectDB = async () => {
  const uri = process.env.MONGO_URI || DEFAULT_URI;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB Initial Connection Error:', error.message);
    // Don't kill process - mongoose will retry or health endpoint can report error
  }
};

module.exports = connectDB;