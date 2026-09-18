// makan-backend/seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Agent = require('./models/Agent');
const Property = require('./models/Property');
const Lead = require('./models/Lead');
const { agents, properties } = require('./data/sampleData');

// Load env variables so we can access MONGO_URI
dotenv.config();

// Connect to DB
connectDB();

const importData = async () => {
  try {
    // 1. Clear out all existing data
    await Property.deleteMany();
    await Agent.deleteMany();
    await Lead.deleteMany();

    // 2. Insert the agents
    const createdAgents = await Agent.insertMany(agents);
    
    // Grab the first agent's ID to assign to our properties
    const adminAgentId = createdAgents[0]._id;

    // 3. Add the agentId to each property
    const sampleProperties = properties.map(property => {
      return { ...property, agentId: adminAgentId };
    });

    // 4. Insert the properties
    await Property.insertMany(sampleProperties);

    console.log('Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error importing data: ${error.message}`);
    process.exit(1);
  }
};

// Run the function
importData();