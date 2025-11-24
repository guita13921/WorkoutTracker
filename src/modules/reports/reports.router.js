const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const reportController = require('./reports.controller');

console.log('authMiddleware type:', typeof authMiddleware);
router.use(authMiddleware);

// GET /api/v1/reports
//router.get('/', reportController.getWorkouts);

// GET /api/v1/report/summary
router.get('/summary', reportController.getWorkoutsSummary);

module.exports = router;
