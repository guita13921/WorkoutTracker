const path = require('path');

// 1) โหลด .env ให้ถูก path (สำคัญสุด)
require('dotenv').config({
    path: path.join(__dirname, '..', '.env'),
});

const app = require('./app');
const PORT = process.env.PORT || 5000;

console.log('DATABASE_URL from env =', process.env.DATABASE_URL); // ลอง debug

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
