process.env.JWT_SECRET = 'test-secret';
const authService = require('../../src/modules/auth/auth.service');
const workoutService = require('../../src/modules/workouts/workout.service');
const bcrypt = require('bcrypt');

jest.mock('../../src/config/db', () => ({
    user: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
    workout: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
    workoutExercise: {
        create: jest.fn(),
        deleteMany: jest.fn(),
    }
}));

jest.mock('bcrypt');

const prisma = require('../../src/config/db');

describe('authService.signup', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
        // Arrange
        const payload = {
            title: "",
            scheduled_at: "2025-11-22T18:00:00.000Z",
            exercises: [... ]
        };

        // Act
        const result = await workoutService.createWorkout(userId, payload);

        // Assert
        // result.success ต้อง false
        // result.message มีคำว่า title
        // prisma.workout.create ต้องไม่ถูกเรียก
    });

    it('Test Case 3: input not have scheduled_at', async () => {
        const payload = {
            title: "Push day",
            // scheduled_at หายไป
            exercises: [... ]
        };

        const result = await workoutService.createWorkout(userId, payload);

        // assert:
        // success === false
        // message มีคำว่า scheduled
        // prisma.workout.create ไม่ถูกเรียก
    });


    it('exercises is empty', async () => {
        const payload = {
            title: "Push day",
            scheduled_at: "...",
            exercises: []
        };

        const result = await workoutService.createWorkout(userId, payload);

        // assert:
        // result.success === false
        // message มีคำว่า exercise
        // prisma.workout.create ไม่ถูกเรียก
    });

});

describe('workoutService.listWorkouts', () => {

});

describe('workoutService.updateWorkout', () => {

});

describe('workoutService.completeWorkout', () => {

});

describe('workoutService.deleteWorkout', () => {

});