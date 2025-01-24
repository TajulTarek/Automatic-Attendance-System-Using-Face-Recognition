const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const router = express.Router();

// Route: Register a new user
router.post('/add', async (req, res) => {
    const { name, uni_id, email, password } = req.body;

    try {
        const userExists = await User.findOne({ uni_id });
        if (userExists) {
            return res.status(400).json({ message: 'Id already exists' });
        }
        const role="Student"
        const newUser = new User({ name, email, password,  uni_id});
        await newUser.save();

        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// Route: Login a user
router.post('/login', async (req, res) => {
    const { uni_id, password } = req.body;

    try {
        const user = await User.findOne({ uni_id });
        if (user && user.password === password) {
            res.status(200).json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user._id,
                    uni_id: user.uni_id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error logging in', error: error.message });
    }
});

router.get('/:student_id', async (req, res) => {
    const { student_id } = req.params;

    try {
        // Find student data by student_id
        const student = await User.findOne({ uni_id:student_id });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Example data structure for the dashboard
        const enrolledCourses = student.courses_enrolled;  // Array of course objects
        console.log(enrolledCourses)

        const courseDetailsPromises = enrolledCourses.map(async (course_id) => {
            const course = await Course.findOne({ course_id: course_id });

            if (!course) {
                return { course_id: course_id, name: 'Course not found', total_classes: 0 };
            }

            return {
                course_id: course.course_id,
                name: course.name,
                total_classes: course.total_class,
            };
        });

        const courseDetails = await Promise.all(courseDetailsPromises);

        res.status(200).json({
            enrolledCourses: courseDetails,
        });
    } catch (error) {
        console.error('Error fetching student dashboard:', error);
        res.status(500).json({ message: 'Error fetching student dashboard', error: error.message });
    }
});



module.exports = router;
