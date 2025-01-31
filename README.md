---

# **🎓 Automatic Attendance System Using Face Recognition**  
A **Node.js + MongoDB** based **automatic attendance system using face recognition**, with scheduled tracking, real-time updates, and role-based access.



![Project Banner](https://www.vervelogic.com/blog/wp-content/uploads/2020/07/Face-Recognition-Automatic-Attendance-System.png)  


![Node.js](https://img.shields.io/badge/Node.js-18.x-brightgreen?style=for-the-badge&logo=node.js) 
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green?style=for-the-badge&logo=mongodb)  
![Express.js](https://img.shields.io/badge/Express.js-4.x-blue?style=for-the-badge)  
![React.js](https://img.shields.io/badge/React.js-18.x-blue?style=for-the-badge&logo=react)  
![Python](https://img.shields.io/badge/Python-3.x-yellow?style=for-the-badge&logo=python)  
![YOLOv8](https://img.shields.io/badge/YOLOv8-Face%20Detection-red?style=for-the-badge)  
![ResNet_v1](https://img.shields.io/badge/ResNet_v1-Face%20Recognition-orange?style=for-the-badge)  


---

## **📌 Features**
✅ **Automatic Attendance Updates** – The system automatically marks attendance for each student in every class.  

✅ **Face Recognition Model Updates** – Students can add more photos to improve recognition accuracy, and the system updates the model dynamically.  

✅ **Scheduled Attendance Capturing** – Teachers can set specific class times when the system will take photos and record attendance automatically.  

✅ **Live Attendance Monitoring** – Real-time tracking of students' presence.  

✅ **Downloadable Attendance Sheets** – Both teachers and students can view and download attendance records.  

✅ **Student Enrollment** – Track and manage enrolled courses for each student.  

✅ **Upcoming Classes** – Fetch schedules dynamically and display upcoming sessions.  

✅ **Admin, Teacher, Student Roles** – Secure role-based authentication with access control.  
    

---

## **🛠 Tech Stack**
🚀 **Backend:** Node.js, Express.js  
🗄 **Database:** MongoDB (Mongoose ODM)  
🎨 **Frontend:** React.js

---

## **📂 Project Structure**
```
📂 Attendance-System
│── 📁 backend
│   ├── 📄 server.js
│   ├── 📂 models
│   │   ├── userModel.js
│   │   ├── scheduleModel.js
│   │   ├── courseModel.js
│   ├── 📂 routes
│   │   ├── userRoutes.js
│   │   ├── courseRoutes.js
│── 📁 frontend
│   ├── 📄 package.json
│   ├── 📂 src
│   │   ├── 📂 components
│   │   ├── 📂 pages

```

---

## **🚀 Installation & Setup**
### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/TajulTarek/Automatic-Attendance-System-Using-Face-Recognition.git
cd attendance-system
```

### **2️⃣ Install Dependencies**
#### **Backend**
```sh
cd Backend
npm install
```

#### **Frontend Teacher-Student**
```sh
cd Frontend
cd teacher-student
npm install
```

#### **Frontend Admin**
```sh
cd Frontend
cd admin
npm install
```

### **3️⃣ Configure Environment**
Create a `.env` file in **backend/**:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

### **4️⃣ Run the Application**
#### **Backend**
```sh
npm start
```
#### **Frontend**
```sh
npm run dev
```
*(Runs on `localhost:3073` by default.)*

---

## **🔗 API Endpoints**

| **Method** | **Endpoint**                     | **Description**                                                                 |
|------------|----------------------------------|---------------------------------------------------------------------------------|
| `GET`      | `/users/upcoming/:studentId`     | Fetch upcoming classes for a specific student based on their enrolled courses.  |
| `POST`     | `/users/register`                | Register a new user (student).                                                  |
| `POST`     | `/auth/login`                    | Authenticate and log in a user (student or teacher).                            |
| `POST`     | `/courses/create`                | Create a new course (admin-only).                                               |
| `GET`      | `/courses/`                      | Fetch all courses.                                                              |
| `POST`     | `/courses/addSchedule`           | Add a new schedule for a course.                                                |
| `GET`      | `/courses/get_attendance/:course_id` | Fetch attendance data for a specific course.                                |
| `POST`     | `/attendance/result`             | Update attendance records for a class based on the provided student IDs.        |
| `POST`     | `/teachers/add`                  | Register a new teacher.                                                         |
| `POST`     | `/teachers/login`                | Authenticate and log in a teacher.                                              |
| `GET`      | `/teachers/:teacher_id`          | Fetch details of a specific teacher, including their assigned courses.          |
| `GET`      | `/teachers/schedules/upcoming`   | Fetch all upcoming schedules for all teachers.                                  |
| `GET`      | `/teachers/schedules/:teacherId` | Fetch upcoming schedules for a specific teacher's assigned courses.             |
| `POST`     | `/users/upload-image`            | Upload an image for a student and process it using a Python script.             |
| `GET`      | `/users/:student_id`             | Fetch details of a specific student, including their enrolled courses.          |

---


---

## **🎥 Demo Video**
📹 *[Watch on YouTube](https://youtu.be/example)* *(Replace with actual link)*  

---

## **👨‍💻 Contributing**
Pull requests are welcome! Please open an issue first to discuss your changes.

1. **Fork the repo**
2. **Create a feature branch**: `git checkout -b feature-branch`
3. **Commit your changes**: `git commit -m "Added new feature"`
4. **Push to the branch**: `git push origin feature-branch`
5. **Open a pull request**

---

## **📜 License**
📄 This project is licensed under the **MIT License**.

---

## **📞 Contact**
💬 **Tarek** – [GitHub](https://github.com/TajulTarek) 
📧 **Email:** tarekahmad484@email.com  

---
