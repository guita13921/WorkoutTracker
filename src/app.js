const express = require('express');
const prisma = require('./config/db');
const indexRouter = require('./routes/index');

const app = express();

app.use(express.json());

app.use('/api/v1', indexRouter);

app.get('/', (req, res) => {
    res.send('Hello from app.js!');
});

app.get('/health/db', async (req, res) => {
    const count = await prisma.user.count();

    res.json({
        success: true,
        users: count,
    });
});

module.exports = app;
