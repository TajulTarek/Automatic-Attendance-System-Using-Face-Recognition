const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const Course = require('../models/Course');
const Schedule=require('../models/Schedule')

const getCurrentDate = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    const [{ value: month }, , { value: day }, , { value: year }] = formatter.formatToParts(now);
    return `${year}-${month}-${day}`; // Return YYYY-MM-DD
};

// Utility function to get the current time in HH:mm format
const getCurrentTime = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    const [{ value: hour }, , { value: minute }] = formatter.formatToParts(now);


    // Ensure that the hour doesn't exceed 23 (24:00 -> 00:00)
    let adjustedHour = parseInt(hour);
    if (adjustedHour >= 24) {
        adjustedHour -= 24;
    }

    // Format the hour to ensure two digits
    adjustedHour = adjustedHour < 10 ? `0${adjustedHour}` : adjustedHour;

    return `${adjustedHour}:${minute}`; // Return HH:mm
};



// Route to register a teacher
router.post('/add', async (req, res) => {
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
    const { teacher_id, password } = req.body;

    try {
        const teacher = await Teacher.findOne({ teacher_id });
        if (teacher && teacher.password === password) {
            res.status(200).json({
                success: true,
                message: 'Login successful',
                user: {
                    id: teacher._id,
                    teacher_id: teacher.teacher_id,
                    name: teacher.name,
                    email: teacher.email,
                    role: teacher.role,
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error logging in teacher', error: error.message });
    }
});



router.get('/:teacher_id', async (req, res) => {
    const { teacher_id } = req.params;

    try {
        const teacher = await Teacher.findOne({ teacher_id: teacher_id });
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        const courses = teacher.assigned_courses

        const courseDetails = [];

        for (const course_id of courses) {
            const course = await Course.findOne({ course_id: course_id }); // Find course by ID
            if (course) {
                courseDetails.push({
                    id: course.course_id,
                    name: course.name,
                    total_students: course.student_ids.length 
                });
            }
        }
            
        
        res.status(200).json({
            teacher_id: teacher.teacher_id,
            name: teacher.name,
            courses: courseDetails
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching teacher', error: error.message });
    }
});

router.get('/schedules/upcoming', async (req, res) => {
    try {
        const todayDate = getCurrentDate()
        const currentTime = getCurrentTime()

        // Fetch all upcoming schedules (future dates or today with upcoming times)
        const upcomingSchedules = await Schedule.find({
            $or: [
                { date: { $gt: todayDate } }, // Future dates
                { date: todayDate, start_time: { $gte: currentTime } } // Today but upcoming times
            ]
        }).sort({ date: 1, start_time: 1 }); // Sort by date and time



        // Send the response with the upcoming classes
        res.json({ upcomingClasses: upcomingSchedules });
    } catch (error) {
        console.error('Error fetching upcoming schedules:', error);
        res.status(500).json({ message: 'Error fetching upcoming schedules' });
    }
});

router.get('/schedules/:teacherId', async (req, res) => {
    try {
        const teacherId = req.params.teacherId;

        // Find the teacher and their assigned courses
        const teacher = await Teacher.findOne({teacher_id: teacherId});
        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        const courseIds = teacher.assigned_courses;

        const todayDate = getCurrentDate()
        const currentTime = getCurrentTime()
        // Fetch upcoming schedules for the teacher's assigned courses
        const upcomingSchedules = await Schedule.find({
            course_id: { $in: courseIds }, // Filter by courses the teacher is teaching
            $or: [
                { date: { $gt: todayDate } }, // Future dates
                { date: todayDate, start_time: { $gte: currentTime } } // Today but upcoming times
            ]
        }).sort({ date: 1, start_time: 1 }); // Sort by date and time

        // Send the response with the teacher's upcoming schedules
        res.json({ upcomingClasses: upcomingSchedules });
    } catch (error) {
        console.error('Error fetching teacher schedules:', error);
        res.status(500).json({ message: 'Error fetching teacher schedules' });
    }
});


module.exports = router;