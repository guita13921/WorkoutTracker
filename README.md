Workout Tracker API (https://roadmap.sh/projects/fitness-workout-tracker)

Overview  
This project is a backend API system for managing workout schedules and tracking user exercise progress.  
It supports user authentication via JWT, workout CRUD operations, exercise selection, workout completion logging, and statistical reporting.  
The system is written in Node.js with Express and uses PostgreSQL via Prisma ORM.

---

Tech Stack  
- Node.js  
- Express.js  
- PostgreSQL  
- Prisma ORM  
- Jest (Unit Testing)  
- JWT Authentication  
- OpenAPI Specification (for API documentation)

---

Features  
1. User Authentication  
   - Signup  
   - Login  
   - JWT-based authorization  
   - Auth middleware to protect routes  

2. Workout Management  
   - Create workout with multiple exercises  
   - List workouts of authenticated user  
   - Update workout data  
   - Delete workout  
   - Mark workout as completed  

3. Workout Logs / Reports  
   - Workout completion history  
   - Duration tracking  
   - Notes during completion  

4. Exercise Data  
   - Seed database with exercise items  
   - Predefined categories and muscle groups  

5. Unit Testing  
   - Mock database for service testing  
   - Tests for signup/login  
   - Tests for workout creation & validation  
   - Tests for workout behavior  

---

Project Structure  
src/  
 ├── app.js  
 ├── server.js  
 ├── config/  
 │    └── prisma.js  
 ├── modules/  
 │    ├── auth/  
 │    │   ├── auth.service.js  
 │    │   ├── auth.controller.js  
 │    │   └── auth.router.js  
 │    ├── workouts/  
 │    │   ├── workout.service.js  
 │    │   ├── workout.controller.js  
 │    │   └── workout.router.js  
 │    └── reports/  
 │        ├── reports.service.js  
 │        ├── reports.controller.js  
 │        └── reports.router.js  
 ├── docs/  
 │    └── openapi.yaml  
tests/  
 ├── auth/  
 │    └── auth.service.test.js  
 └── workouts/  
      └── workout.service.test.js  

---

Environment Variables (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"  
JWT_SECRET="yoursecret"  
PORT=5000

---

Running the Project  

1. Install dependencies  
   npm install

2. Run database migrations  
   npx prisma migrate dev

3. Seed database (optional)  
   npm run seed

4. Start server  
   npm run dev  
   or  
   node src/server.js

---

Testing  
Run all unit tests:  
   npm test

This project uses mock database via jest.mock()  
Tests do not require real PostgreSQL instance.

---

Authentication Usage (Postman Example)

1) Login  
POST /api/v1/auth/login  
Body:  
{  
  "email": "test@example.com",  
  "password": "123456"  
}

Response includes:  
{  
  "success": true,  
  "token": "..."  
}

2) Access protected API  
Include header:  
Authorization: Bearer <token>

---

Example Create Workout Request  
POST /api/v1/workouts  
Authorization: Bearer <token>  
Body:  
{  
  "title": "Push day",  
  "notes": "focus chest",  
  "scheduled_at": "2025-11-22T18:00:00.000Z",  
  "exercises": [  
    { "exercise_id": 1, "sets": 3, "reps": 10, "weight": 40, "order_index": 1 },  
    { "exercise_id": 2, "sets": 4, "reps": 8, "weight": 60, "order_index": 2 }  
  ]  
}

---

OpenAPI Documentation  
Location:  
src/docs/openapi.yaml

You can load this into Swagger, Postman, or Insomnia  
to auto-generate API UI documentation.

---

Author  
Channarong Duangsupa  
Workout Tracker Project  
2025

