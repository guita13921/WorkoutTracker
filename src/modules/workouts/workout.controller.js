const workoutService = require('./workout.service');

async function getWorkouts(req, res, next) {
    try {
        const userId = req.user.id;
        const workOuts = await (workoutService.listWorkouts(userId, {}));
        return res.status(200).json({
            success: true,
            data: workOuts,
        });
    } catch (err) {
        next(err);
    };
}

async function createWorkout(req, res, next) {
    try {
        const userId = req.user.id;
        const payload = req.body;

        const newWorkOuts = await workoutService.createWorkout(userId, payload);
        return res.status(201).json({
            success: true,
            data: newWorkOuts,
        });
    } catch (err) {
        next(err);
    };
}

module.exports = {
    getWorkouts,
    createWorkout,
};
