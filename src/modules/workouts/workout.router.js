const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const workoutController = require('./workout.controller');

console.log('authMiddleware type:', typeof authMiddleware);
router.use(authMiddleware);

// GET /api/v1/workouts
router.get('/', workoutController.getWorkouts);

// GET /api/v1/workouts/:id 
//router.get('/:id', workoutController.getWorkoutById);

// POST /api/v1/workouts
router.post('/', workoutController.createWorkout);

// PUT /api/v1/workouts/:id  
router.put('/:id', workoutController.updateWorkout);

// DELETE /api/v1/workouts/:id
router.delete('/:id', workoutController.deleteWorkout);

// POST /api/v1/workouts/:id/complete 
router.post('/:id/complete', workoutController.completeWorkout);

module.exports = router;