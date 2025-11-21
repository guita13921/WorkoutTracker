const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const workoutController = require('./workout.controller');

console.log('authMiddleware type:', typeof authMiddleware);
router.use(authMiddleware);

// GET /api/v1/workouts
router.get('/', workoutController.getWorkouts);

// POST /api/v1/workouts
router.post('/', workoutController.createWorkout);

module.exports = router;