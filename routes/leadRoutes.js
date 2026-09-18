// makan-backend/routes/leadRoutes.js
const express = require('express');
const router = express.Router();
const { createLead } = require('../controllers/leadController');

router.route('/').post(createLead);

module.exports = router;