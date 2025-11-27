process.env.JWT_SECRET = 'test-secret';
const bcrypt = require('bcrypt');

jest.mock('@prisma/client', () => ({
    Status: { COMPLETED: 'COMPLETED' }
}));

jest.mock('../../src/config/db', () => ({
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
    workout: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    workoutExercise: {
        create: jest.fn(),
        deleteMany: jest.fn(),
    },
    workoutLog: {
        create: jest.fn(),
        deleteMany: jest.fn(),
    }
}));

jest.mock('bcrypt');

const prisma = require('../../src/config/db');
const authService = require('../../src/modules/auth/auth.service');
const workoutService = require('../../src/modules/workouts/workout.service');
const reportService = require('../../src/modules/reports/reports.service');

describe('authService.signup', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        bcrypt.genSalt.mockResolvedValue('salt');
        bcrypt.hash.mockResolvedValue('hashed_password');
    });


    it('should signup successfully when email is not used', async () => {
        // Arrange
        const fakeInput = {
            email: 'test@example.com',
            password: '123456',
            username: 'tester',
        };

        // mock ให้ findUnique คืน null (แปลว่าไม่เจอ user เดิม)
        prisma.user.findUnique.mockResolvedValue(null);

        // mock ให้ create คืน user ใหม่
        prisma.user.create.mockResolvedValue({
            id: 1,
            email: fakeInput.email,
            username: fakeInput.username,
            password_hash: 'hashed_password', // ตาม schema คุณ
        });

        // Act
        const result = await authService.signup(fakeInput);

        // Assert
        expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: fakeInput.email },
        });

        expect(prisma.user.create).toHaveBeenCalledTimes(1);
        expect(result.success).toBe(true);
        expect(result.user.email).toBe(fakeInput.email);
        expect(result.token).toBeDefined();
    });

    it('should fail if email already exists', async () => {
        const fakeInput = {
            email: 'dup@example.com',
            password: '123456',
            username: 'dup',
        };

        prisma.user.findUnique.mockResolvedValue({
            id: 99,
            email: fakeInput.email,
            username: 'oldUser',
            password_hash: 'xxx',
        });

        const result = await authService.signup(fakeInput);

        expect(result.success).toBe(false);
        expect(result.message).toMatch(/Email already in use/i);
        expect(prisma.user.create).not.toHaveBeenCalled();
    });

});

describe('authService.login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        prisma.user.findUnique = jest.fn();
        prisma.user.create = jest.fn();
    });

    it('should login successfully with correct email & password', async () => {
        const fakeInput = {
            email: 'login@example.com',
            password: '123456',
        };

        prisma.user.findUnique.mockResolvedValue({
            id: 1,
            email: fakeInput.email,
            username: 'loginUser',
            password_hash: 'hashed_pw',
        });

        bcrypt.compare.mockResolvedValue(true);

        const result = await authService.login(fakeInput);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: fakeInput.email },
        });
        expect(bcrypt.compare).toHaveBeenCalledWith(
            fakeInput.password,
            'hashed_pw'
        );
        expect(result.success).toBe(true);
        expect(result.token).toBeDefined();
    });

    it('should fail if email does not exist', async () => {
        const fakeInput = {
            email: 'login@example.com',
            password: '123456',
        };

        // mock ว่าไม่เจอ user ใน DB
        prisma.user.findUnique.mockResolvedValue(null);

        const result = await authService.login(fakeInput);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: fakeInput.email },
        });
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/Invalid credentials/i);
        expect(result.token).toBeUndefined();
    });

    it('should fail if password is incorrect', async () => {
        const fakeInput = {
            email: 'login@example.com',
            password: '123456',
        };

        prisma.user.findUnique.mockResolvedValue({
            id: 1,
            email: fakeInput.email,
            username: 'loginUser',
            password_hash: 'hashed_pw',
        });

        bcrypt.compare.mockResolvedValue(false);

        const result = await authService.login(fakeInput);

        expect(bcrypt.compare).toHaveBeenCalledWith(
            fakeInput.password,
            'hashed_pw'
        );

        expect(result.success).toBe(false);
        expect(result.message).toMatch(/Invalid email or password/i);
        expect(result.token).toBeUndefined();
    });

});

describe('workoutService.createWorkout', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create workout successfully', async () => {

        // Arrange
        const userId = 1;
        const fakeInput = {
            title: "Push day",
            notes: "focus chest",
            scheduled_at: "2025-11-22T18:00:00.000Z",
            exercises: [
                { "exercise_id": 1, "sets": 3, "reps": 10, "weight": 40, "order_index": 1 },
                { "exercise_id": 2, "sets": 4, "reps": 8, "weight": 60, "order_index": 2 }
            ]
        }

        const fakeCreatedWorkout = ({
            id: 10,
            user_id: userId,
            title: fakeInput.title,
            notes: fakeInput.notes,
            status: "PENDING",
            scheduled_at: new Date(fakeInput.scheduled_at),
            exercises: [
                {
                    id: 7,
                    workout_id: 6,
                    exercise_id: 1,
                    sets: 3,
                    reps: 10,
                    weight: 40,
                    order_index: 1
                },
                {
                    id: 8,
                    workout_id: 6,
                    exercise_id: 2,
                    sets: 4,
                    reps: 8,
                    weight: 60,
                    order_index: 2
                }
            ]
        });

        prisma.workout.create.mockResolvedValue({
            id: 10,
            user_id: userId,
            title: fakeInput.title,
            notes: fakeInput.notes,
            status: 'PENDING',
            scheduled_at: new Date(fakeInput.scheduled_at),
        });

        prisma.workout.findUnique.mockResolvedValue(fakeCreatedWorkout);

        //Act:
        const result = await workoutService.createWorkout(userId, fakeInput);

        // เช็คว่า prisma.workout.create ถูกเรียกถูกต้อง
        expect(prisma.workout.create).toHaveBeenCalledTimes(1);
        expect(prisma.workout.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                user_id: userId,
                title: fakeInput.title,
                notes: fakeInput.notes,
                scheduled_at: new Date(fakeInput.scheduled_at),
                status: 'PENDING',
            }),
        });

        // เช็คว่า findUnique ถูกเรียกเพื่อดึง workout ที่รวม exercises
        expect(prisma.workout.findUnique).toHaveBeenCalledWith({
            where: { id: 10 },
            include: { exercises: true },
        });

        // ตรงนี้สำคัญ: service **ไม่ได้** return { success, workout }
        // มัน return workout ตรง ๆ
        expect(result.id).toBe(10);
        expect(result.title).toBe(fakeInput.title);
        expect(result.user_id).toBe(userId);
        expect(result.exercises).toHaveLength(2);
    });

    it('input not have title', async () => {
        const userId = 1;
        const payload = {
            scheduled_at: "2025-11-22T18:00:00.000Z",
            exercises: []
        };

        prisma.workout.create.mockResolvedValue({ id: 11 });
        prisma.workout.findUnique.mockResolvedValue({ id: 11, exercises: [] });

        const result = await workoutService.createWorkout(userId, payload);

        expect(prisma.workout.create).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ id: 11, exercises: [] });
    });

    it('Test Case 3: input not have scheduled_at', async () => {
        const userId = 1;
        const payload = {
            title: "Push day",
            exercises: [{ exercise_id: 1, sets: 3, reps: 10, weight: 50 }]
        };

        prisma.workout.create.mockResolvedValue({ id: 12 });
        prisma.workoutExercise.create.mockResolvedValue({});
        prisma.workout.findUnique.mockResolvedValue({ id: 12, exercises: [{ id: 1 }] });

        const result = await workoutService.createWorkout(userId, payload);

        expect(prisma.workout.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                title: payload.title,
                status: 'PENDING',
                scheduled_at: expect.any(Date)
            })
        });
        expect(prisma.workoutExercise.create).toHaveBeenCalledTimes(1);
        expect(result.exercises).toHaveLength(1);
    });

    it('exercises is empty', async () => {
        const userId = 1;
        const payload = {
            title: "Push day",
            scheduled_at: "...",
            exercises: []
        };

        prisma.workout.create.mockResolvedValue({ id: 13 });
        prisma.workout.findUnique.mockResolvedValue({ id: 13, exercises: [] });

        const result = await workoutService.createWorkout(userId, payload);

        expect(prisma.workoutExercise.create).not.toHaveBeenCalled();
        expect(result).toEqual({ id: 13, exercises: [] });
    });

});

describe('workoutService.listWorkouts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return workouts filtered by status when provided', async () => {
        const userId = 1;
        const workouts = [{ id: 1, status: 'PENDING' }];
        prisma.workout.findMany.mockResolvedValue(workouts);

        const result = await workoutService.listWorkouts(userId, 'PENDING');

        expect(prisma.workout.findMany).toHaveBeenCalledWith({
            where: { user_id: userId, status: 'PENDING' },
            orderBy: { scheduled_at: 'asc' },
            include: { exercises: true }
        });
        expect(result).toBe(workouts);
    });
});

describe('workoutService.updateWorkout', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return not found when workout does not exist', async () => {
        prisma.workout.findFirst.mockResolvedValue(null);

        const result = await workoutService.updateWorkout(1, 99, {});

        expect(result).toEqual({ success: false, message: "Workout not found" });
    });

    it('should return existing workout when no fields provided', async () => {
        const existing = { id: 1, user_id: 1, title: 'Old' };
        prisma.workout.findFirst.mockResolvedValue(existing);

        const result = await workoutService.updateWorkout(1, 1, {});

        expect(prisma.workout.update).not.toHaveBeenCalled();
        expect(result).toEqual({ success: true, data: existing });
    });

    it('should update workout when data is provided', async () => {
        const existing = { id: 1, user_id: 1, title: 'Old' };
        const updated = { id: 1, user_id: 1, title: 'New', exercises: [] };
        prisma.workout.findFirst.mockResolvedValue(existing);
        prisma.workout.update.mockResolvedValue(updated);

        const result = await workoutService.updateWorkout(1, 1, { title: 'New' });

        expect(prisma.workout.update).toHaveBeenCalledWith({
            where: { id: existing.id },
            data: { title: 'New' },
            include: { exercises: true },
        });
        expect(result).toEqual({ success: true, data: updated });
    });
});

describe('workoutService.completeWorkout', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return not found when workout does not exist', async () => {
        prisma.workout.findFirst.mockResolvedValue(null);

        const result = await workoutService.completeWorkout(1, 1, { total_duration: 30 });

        expect(result).toEqual({ success: false, message: "Workout not found" });
    });

    it('should validate payload for total_duration', async () => {
        prisma.workout.findFirst.mockResolvedValue({ id: 1 });

        const result = await workoutService.completeWorkout(1, 1, { notes: 'x' });

        expect(result.success).toBe(false);
        expect(result.message).toMatch(/total_duration/i);
        expect(prisma.workout.update).not.toHaveBeenCalled();
    });

    it('should complete workout and create log', async () => {
        prisma.workout.findFirst.mockResolvedValue({ id: 1 });
        prisma.workout.update.mockResolvedValue({ id: 1 });
        const log = { id: 99, workout_id: 1, total_duration: 45 };
        prisma.workoutLog.create.mockResolvedValue(log);

        const result = await workoutService.completeWorkout(1, 1, { total_duration: 45, notes: 'done' });

        expect(prisma.workout.update).toHaveBeenCalled();
        expect(prisma.workoutLog.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                workout_id: 1,
                total_duration: 45,
                notes: 'done'
            }),
        });
        expect(result).toEqual({ success: true, data: log });
    });
});

describe('workoutService.deleteWorkout', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return not found when workout does not exist', async () => {
        prisma.workout.findFirst.mockResolvedValue(null);

        const result = await workoutService.deleteWorkout(1, 1);

        expect(result).toEqual({ success: false, message: "Workout not found" });
    });

    it('should delete workout and related data', async () => {
        prisma.workout.findFirst.mockResolvedValue({ id: 1 });

        const result = await workoutService.deleteWorkout(1, 1);

        expect(prisma.workoutExercise.deleteMany).toHaveBeenCalledWith({ where: { workout_id: 1 } });
        expect(prisma.workoutLog.deleteMany).toHaveBeenCalledWith({ where: { workout_id: 1 } });
        expect(prisma.workout.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(result).toEqual({ success: true, status: 200 });
    });
});

describe('reportService.getWorkoutsSummary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should summarize completed workouts within date range', async () => {
        const workouts = [
            {
                id: 1,
                logs: [
                    { total_duration: 30 },
                    { total_duration: 20 },
                ]
            },
            {
                id: 2,
                logs: [
                    { total_duration: 15 }
                ]
            }
        ];

        prisma.workout.findMany.mockResolvedValue(workouts);

        const payload = { from: '2025-01-01', to: '2025-12-31' };
        const result = await reportService.getWorkoutsSummary(1, payload);

        expect(prisma.workout.findMany).toHaveBeenCalledWith({
            where: {
                user_id: 1,
                status: expect.any(String),
                logs: {
                    some: {
                        performed_at: {
                            gte: new Date(payload.from),
                            lte: new Date(payload.to),
                        }
                    }
                }
            },
            include: { logs: true }
        });

        expect(result).toEqual({
            success: true,
            data: {
                total_completed: 2,
                total_duration: 65,
                from: payload.from,
                to: payload.to,
            }
        });
    });
});
