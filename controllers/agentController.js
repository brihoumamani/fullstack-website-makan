// makan-backend/controllers/agentController.js
const Agent = require('../models/Agent');

// @desc    Get all agents
// @route   GET /api/agents
// @access  Public
const getAgents = async (req, res) => {
  try {
    const agents = await Agent.find();
    res.status(200).json({
      success: true,
      count: agents.length,
      data: agents
    });
  } catch (error) {
    console.error(`Error fetching agents: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single agent by ID
// @route   GET /api/agents/:id
// @access  Public
const getAgentById = async (req, res) => {
  try {
    const agent = await Agent.findById(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }
    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }
    console.error(`Error fetching agent: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getAgents,
  getAgentById
};