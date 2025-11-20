const express = require('express');
const router = express.Router();

router.use('/auth', require('../modules/auth/auth.router'));
router.use('/workouts', require('../modules/workouts/workout.router.js'));

module.exports = router;