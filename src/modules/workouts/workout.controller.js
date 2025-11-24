const workoutService = require('./workout.service');

async function getWorkouts(req, res, next) {
    try {
        const userId = req.user.id;
        const result = await (workoutService.listWorkouts(userId, {}));
        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    };
}

async function createWorkout(req, res, next) {
    try {
        const userId = req.user.id;
        const payload = req.body;

        const result = await workoutService.createWorkout(userId, payload);
        return res.status(201).json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    };
}

async function updateWorkout(req, res, next) {
    try {
        const userId = req.user.id;
        const workoutId = Number(req.params.id);
        const data = req.body;

        const result = await workoutService.updateWorkout(userId, workoutId, data);

        // กรณีใช้ updateMany แล้ว service คืน { count: 0 }
        if (!result || result.count === 0) {
            return res.status(404).json({
                success: false,
                message: 'Workout not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    };
}

async function deleteWorkout(req, res, next) {
    try {
        const userId = req.user.id;
        const workoutId = Number(req.params.id);

        const result = await workoutService.deleteWorkout(userId, workoutId);
        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    };
}

async function completeWorkout(req, res, next) {
    try {
        const userId = req.user.id;
        const workoutId = Number(req.params.id);
        const payload = req.body;
        const result = await workoutService.completeWorkout(userId, workoutId, payload);

        // ถ้า service ของคุณคืน { success: false, message: '...' }
        if (!result || result.success === false) {
            return res.status(404).json({
                success: false,
                message: result?.message || 'Workout not found',
            });
        }

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    };
}


module.exports = {
    getWorkouts,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    completeWorkout
};
