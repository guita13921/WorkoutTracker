const prisma = require('../../config/db');

async function listWorkouts(userId, status) {
    // TODO:
    // - ใช้ prisma.workout.findMany(...)
    // - where: { userId, ...filter อื่น ๆ เช่น status หรือวันที่ }
    // - orderBy: scheduled_at
    // - return array ของ workouts

    const whereClause = {
        user_id: userId,
        ...(status && { status: status })   // ใส่เฉพาะตอนมี
    };

    const workouts = await prisma.workout.findMany({
        where: whereClause,
        orderBy: { scheduled_at: 'asc' },
        include: {
            exercises: true,  // ถ้าอยากได้รายการ exercises ด้วย
        }
    });

    return workouts;
}

async function createWorkout(userId, payload) {
    // TODO:
    // - แยก field จาก payload: title, scheduled_at, exercises
    // - ใช้ prisma.workout.create({ data: { ... } })
    //   อาจใช้ nested create สำหรับ WorkoutExercise ด้วย
    // - return workout ที่สร้าง พร้อม exercises

    const { title, notes, scheduled_at, exercises } = payload;

    const workout = await prisma.workout.create({
        data: {
            user_id: userId,
            title,
            notes,
            scheduled_at: new Date(scheduled_at),
            status: 'PENDING'
        }
    });

    //ถ้ามี exercises → create หลาย record
    if (Array.isArray(exercises)) {
        for (const ex of exercises) {
            await prisma.workoutExercise.create({
                data: {
                    workout_id: workout.id,
                    exercise_id: ex.exercise_id,
                    sets: ex.sets,
                    reps: ex.reps,
                    weight: ex.weight,
                    order_index: ex.order_index || 1
                }
            });
        }
    }

    //return workout พร้อม exercises
    return prisma.workout.findUnique({
        where: { id: workout.id },
        include: { exercises: true }
    });
}

// Payload
/*
{
  "title": "Push day",
  "notes": "focus chest",
  "scheduled_at": "2025-11-22T18:00:00.000Z",
  "exercises": [
    { "exercise_id": 1, "sets": 3, "reps": 10, "weight": 40, "order_index": 1 },
    { "exercise_id": 2, "sets": 4, "reps": 8, "weight": 60, "order_index": 2 }
  ]
}
*/

module.exports = {
    listWorkouts,
    createWorkout,
};