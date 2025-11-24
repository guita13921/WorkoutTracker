require('dotenv').config();
const prisma = require('../../config/db');
const { Status } = require('@prisma/client');


async function getWorkoutsSummary(userId, payload) {

    const { from, to } = payload;

    const workouts = await prisma.workout.findMany({
        where: {
            user_id: userId,
            status: Status.COMPLETED,
            ...(from && to && {
                logs: {
                    some: {
                        performed_at: {
                            gte: new Date(from),
                            lte: new Date(to),
                        }
                    }
                }
            })
        },
        include: {
            logs: true,
        }
    });

    const total_completed = workouts.length;

    let total_duration = 0;
    workouts.forEach(w => {
        w.logs.forEach(log => {
            total_duration += log.total_duration;
        });
    });

    return {
        success: true,
        data: {
            total_completed,
            total_duration,
            from: from || null,
            to: to || null,
        }
    };
}
/*
async function main() {
    const payload = {
        from: "2025-01-01",
        to: "2026-02-01",
        JSON: true
    };

    const result = await getWorkoutsSummary(2, payload);

    console.log("===== RESULTS =====");
    console.dir(result, { depth: null });

    await prisma.$disconnect();
}
*/

//main();

module.exports = {
    getWorkoutsSummary
};
