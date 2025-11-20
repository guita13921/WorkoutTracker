const jwt = require('jsonwebtoken');
const prisma = require('../config/db'); // หรือ path ที่คุณใช้จริง
const JWT_SECRET = process.env.JWT_SECRET;


async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Authorization header missing or invalid',
        });
    } else {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            // decoded ควรมี id, email (จาก generateToken ของคุณ)
            req.user = {
                id: decoded.id,
                email: decoded.email,
            };

            // optional: เช็คใน DB ว่า user ยังอยู่จริงไหม (ถ้าอยาก robust)
            const user = await prisma.user.findUnique({ where: { id: decoded.id } });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found',
                });
            }

            // ถ้าทุกอย่างโอเค → ไป middleware/route ถัดไป
            return next();

        } catch (err) {
            // token ใช้ไม่ได้ เช่น หมดอายุ / ปลอม / secret ไม่ตรง
            // ส่ง 401 กลับ
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token',
            });
        }
    }
}

module.exports = authMiddleware;