// auth.service.js
const prisma = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10; // จำนวนรอบในการ hash password

function generateToken(user) {

    const payload = {
        id: user.id,
        email: user.email,
    };

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    const options = {
        expiresIn: '1h',
    };

    return jwt.sign(payload, secret, options);
}

async function signup({ email, password, username }) {
    // 1) เช็คว่ามี user ที่ใช้ email นี้อยู่แล้วหรือยัง
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        return {
            success: false,
            message: 'Email already in use',
        };
    }

    // 2) hash password ด้วย bcrypt
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const password_hash = await bcrypt.hash(password, salt);

    // 3) บันทึก user ใหม่ลง database ผ่าน prisma.user.create(...)
    const user = await prisma.user.create({
        data: {
            email,
            username,
            password_hash, // ถ้าใน schema ใช้ชื่อ field อื่น ต้องเปลี่ยนให้ตรง
        },
    });

    // 4) สร้าง JWT token จาก user ที่สร้าง
    const token = generateToken(user);

    // 5) คืนค่า object ที่ service อยากให้ controller เอาไปใช้
    return {
        success: true,
        token,
        user: { id: user.id, email: user.email, username: user.username },
    };
}


async function login({ email, password }) {
    // 1) หา user จาก email ใน database
    const user = await prisma.user.findUnique({ where: { email } });

    // 2) ถ้าไม่เจอ user → จัดการ error (อาจ throw หรือ return { success: false, message: 'Invalid credentials' })
    if (!user) {
        return {
            success: false,
            message: 'Invalid credentials',
        };
    }

    // 3) เปรียบเทียบ password กับ user.passwordHash (หรือชื่อ field ที่คุณใช้)
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
        return {
            success: false,
            message: 'Invalid email or password',
        };
    }

    // 4) สร้าง JWT token
    const token = generateToken(user);

    // 5) คืนข้อมูลกลับไป
    return {
        success: true,
        token,
        user: { id: user.id, email: user.email, username: user.username },
    };
}

module.exports = {
    signup,
    login,
};