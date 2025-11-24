const reportService = require('./reports.service');

async function getWorkoutsSummary(req, res, next) {
    try {
        const userId = req.user.id;
        const { from, to } = req.query;

        const result = await reportService.getWorkoutsSummary(userId, { from, to });

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (err) {
        next(err);
    }
}


module.exports = {
    getWorkoutsSummary
};
