const { Debug } = require('@prisma/client/runtime/library');
const prisma = require('../../config/db');
const { Status } = require('@prisma/client');

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

async function updateWorkout(userId, workoutId, data) {
    const existing = await prisma.workout.findFirst({
        where: {
            id: workoutId,
            user_id: userId,
        }
    });

    if (!existing) {
        return {
            success: false,
            message: "Workout not found"
        };
    }

    let updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.scheduled_at !== undefined) updateData.scheduled_at = new Date(data.scheduled_at);

    if (Object.keys(updateData).length === 0) {
        return { success: true, data: existing };
    }

    const updated = await prisma.workout.update({
        where: { id: existing.id },
        data: updateData,
        include: { exercises: true },
    });

    return { success: true, data: updated };
}

async function deleteWorkout(userId, workoutId) {
    const existing = await prisma.workout.findFirst({
        where: {
            id: workoutId,
            user_id: userId,
        }
    });

    if (!existing) {
        return {
            success: false,
            message: "Workout not found"
        };
    }

    await prisma.workoutExercise.deleteMany({
        where: { workout_id: workoutId },
    });

    await prisma.workoutLog.deleteMany({
        where: { workout_id: workoutId },
    });

    await prisma.workout.delete({
        where: { id: workoutId }
    });

    return { success: true, status: 200 };
}

async function completeWorkout(userId, workoutId, payload) {
    const existing = await prisma.workout.findFirst({
        where: {
            id: workoutId,
            user_id: userId,
        }
    });

    if (!existing) {
        return {
            success: false,
            message: "Workout not found"
        };
    }

    if (!payload || typeof payload.total_duration !== 'number') {
        return {
            success: false,
            message: 'total_duration is required and must be a number',
        };
    }


    await prisma.workout.update({
        where: { id: workoutId },
        data: { status: Status.COMPLETED }
    });

    const WorkoutLog = await prisma.workoutLog.create({
        data: {
            workout_id: workoutId,
            performed_at: payload.performed_at ? new Date(payload.performed_at) : new Date(),
            total_duration: Number(payload.total_duration),
            notes: payload.notes
        },
    });

    return { success: true, data: WorkoutLog };
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
    updateWorkout,
    deleteWorkout,
    completeWorkout
};