// prisma/seed.js
// 1) import PrismaClient
// 2) เตรียม array ของ exercises เช่น [
//    { name: 'Bench Press', description: '...', category: 'chest' },
//    ...
// ]
// 3) ใช้ prisma.exercise.createMany(...) หรือ upsert เป็นรายตัว
// 4) ปิด prisma ด้วย prisma.$disconnect()

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const data = [
        {
            name: "Running",
            description: "5 KM, Morning Run.",
            category: "Cardio"
        },
        {
            name: "Bench Press",
            description: "Chest workout with barbell",
            category: "Chest"
        }
    ];

    await prisma.exercise.createMany({
        data: data
    });
}

//prisma.$disconnect() in main()
main()
    .then(() => prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });

