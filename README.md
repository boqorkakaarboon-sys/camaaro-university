# 🎓 Camaaro University Management System

A full-stack University Management System built with Node.js, Express, MongoDB, React, and Vite.

---

## 📁 Project Structure

```
camaaro/
├── backend/
│   ├── models/          User, Course, Exam, Result
│   ├── routes/          auth, users, courses, exams
│   ├── middleware/       auth (JWT protect + authorize)
│   ├── server.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/  Navbar, Sidebar, Card
    │   ├── pages/       Login, Dashboard, Admin, Teacher, Student
    │   ├── context/     AuthContext
    │   ├── services/    api.js (Axios)
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Prerequisites

- **Node.js** v18+
- **MongoDB** running locally on `mongodb://localhost:27017`
  - Install: https://www.mongodb.com/try/download/community
  - Or use MongoDB Atlas (update MONGO_URI in .env)

---

## 🚀 Setup & Run

### 1. Backend

```bash
cd camaaro/backend
npm install
# Edit .env if needed (especially MONGO_URI)
npm run dev      # development with nodemon
# or
npm start        # production
```

Backend runs on: **http://localhost:5000**

On first start, an admin account is auto-created:
- **Email:** `admin@camaaro.edu`
- **Password:** `admin123`

---

### 2. Frontend

```bash
cd camaaro/frontend
npm install
npm run dev
```

Frontend runs on: **http://localhost:5173**

---

## 🔑 Default Credentials

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@camaaro.edu      | admin123   |

> Register additional teachers and students via the app.

---

## 👥 Role-Based Access

### Admin
- Full user management (create, deactivate, delete)
- Create courses and assign teachers
- Schedule and publish exams
- Record and view all results

### Teacher
- View assigned courses
- Create and publish exams for their courses
- Record student results/grades

### Student
- View enrolled courses
- See published exams
- View personal results with grade breakdown

---

## 🔌 API Endpoints

### Auth
| Method | Route                    | Description        |
|--------|--------------------------|--------------------|
| POST   | /api/auth/register       | Register user      |
| POST   | /api/auth/login          | Login user         |
| GET    | /api/auth/me             | Get current user   |
| PUT    | /api/auth/updateprofile  | Update own profile |

### Users (Admin only)
| Method | Route            | Description      |
|--------|------------------|------------------|
| GET    | /api/users       | Get all users    |
| GET    | /api/users/:id   | Get single user  |
| POST   | /api/users       | Create user      |
| PUT    | /api/users/:id   | Update user      |
| DELETE | /api/users/:id   | Delete user      |

### Courses
| Method | Route                        | Description          |
|--------|------------------------------|----------------------|
| GET    | /api/courses                 | Get courses (by role)|
| GET    | /api/courses/all             | All courses (admin)  |
| POST   | /api/courses                 | Create course        |
| PUT    | /api/courses/:id             | Update course        |
| PUT    | /api/courses/:id/assign-teacher | Assign teacher    |
| PUT    | /api/courses/:id/enroll      | Enroll student       |
| DELETE | /api/courses/:id             | Delete course        |

### Exams
| Method | Route                      | Description           |
|--------|----------------------------|-----------------------|
| GET    | /api/exams                 | Get exams (by role)   |
| GET    | /api/exams/all             | All exams (admin)     |
| POST   | /api/exams                 | Create exam           |
| PUT    | /api/exams/:id             | Update/publish exam   |
| DELETE | /api/exams/:id             | Delete exam           |
| GET    | /api/exams/:id/results     | Get exam results      |
| POST   | /api/exams/:id/results     | Add result            |
| GET    | /api/exams/student/myresults | Student's results   |

---

## 🛡️ Security

- Passwords hashed with **bcryptjs** (10 salt rounds)
- Authentication via **JWT** (7-day expiry)
- All routes protected by `protect` middleware
- Role-based access via `authorize(...roles)` middleware
- 401 auto-logout on token expiry

---

## 📊 Grade Scale

| Percentage | Grade |
|------------|-------|
| ≥ 90%      | A+    |
| ≥ 80%      | A     |
| ≥ 70%      | B+    |
| ≥ 60%      | B     |
| ≥ 55%      | C+    |
| ≥ 50%      | C     |
| ≥ 40%      | D     |
| < 40%      | F     |

---

## 🌍 Environment Variables (backend/.env)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/camaaro_university
JWT_SECRET=camaaro_university_super_secret_jwt_key_2024
JWT_EXPIRE=7d
NODE_ENV=development
```

---

Built with ❤️ — Camaaro University © 2024
