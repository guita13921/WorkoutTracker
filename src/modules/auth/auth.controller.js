const authService = require('./auth.service');
// ถ้ามี error helper ในอนาคต เช่น:
// const { BadRequestError, UnauthorizedError } = require('../../utils/errors');

async function signup(req, res, next) {
    try {
        const { email, password, username } = req.body;

        // validation
        if (!email || !password || !username) {
            return res.status(400).json({
                success: false,
                message: 'email, password and username are required'
            });
        }

        const result = await authService.signup({ email, password, username });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'email and password are required'
            });
        }

        const result = await authService.login({ email, password });

        if (!result.success) {
            return res.status(401).json(result);
        }

        return res.status(200).json(result);

    } catch (err) {
        // 6) ส่ง error ต่อให้ middleware error handler จัดการ
        next(err);
    }
}

module.exports = {
    signup,
    login,
};
