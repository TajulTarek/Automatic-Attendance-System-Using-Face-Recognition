const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');

// Route to register a teacher
router.post('/register', async (req, res) => {
    const { teacher_id, email, name, password } = req.body;

    try {
        // Check if the teacher already exists
        const teacherExists = await Teacher.findOne({ teacher_id });
        if (teacherExists) {
            return res.status(400).json({ message: 'Teacher with this ID already exists' });
        }

        // Create a new teacher
        const newTeacher = new Teacher({
            teacher_id,
            email,
            name,
            password,  // For production, password should be hashed
            assigned_courses: []  // Start with no assigned courses
        });

        await newTeacher.save();

        res.status(201).json({ message: 'Teacher registered successfully', teacher: newTeacher });
    } catch (error) {
        res.status(500).json({ message: 'Error registering teacher', error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the teacher by email
        const teacher = await Teacher.findOne({ email });
        if (!teacher) {
            return res.status(400).json({ message: 'Teacher not found' });
        }

        if (teacher.password !== password) {
            return res.status(400).json({ message: 'Incorrect password' });
        }

        res.status(200).json({
            message: 'Login successful'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in teacher', error: error.message });
    }
});

module.exports = router;
