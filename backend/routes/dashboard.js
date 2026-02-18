const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const DashboardController = require('../controller/DashboardController');

router.use(authMiddleware);
router.get('/stats', DashboardController.getStats);

module.exports = router;
