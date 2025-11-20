const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');

console.log('authMiddleware type:', typeof authMiddleware);
router.use(authMiddleware);

router.get('/', (req, res) => {
    res.json({ success: true, user: req.user });
});

module.exports = router;