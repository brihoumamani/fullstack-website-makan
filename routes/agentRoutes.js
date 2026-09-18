// makan-backend/routes/agentRoutes.js
const express = require('express');
const router = express.Router();
const { getAgents, getAgentById } = require('../controllers/agentController');

router.route('/').get(getAgents);
router.route('/:id').get(getAgentById);

module.exports = router;