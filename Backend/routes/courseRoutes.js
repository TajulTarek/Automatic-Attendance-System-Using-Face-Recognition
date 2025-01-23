const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User')
const Schedule = require('../models/Schedule');
const Teacher=require('../models/Teacher')

// Helper function to check if two time ranges overlap
function isTimeOverlap(existingStart, existingEnd, newStart, newEnd) {
    return (newStart < existingEnd && newEnd > existingStart);
}

// Route to create a course (Admin only)
router.post('/create', async (req, res) => {
    const { course_id, name, teacher_id, student_ids } = req.body;

    try {
        // Check if the course already exists
        const courseExists = await Course.findOne({ course_id });
        if (courseExists) {
            return res.status(400).json({ message: 'Course with this ID already exists' });
        }

        // Validate required fields
        if (!course_id || !name || !teacher_id || !student_ids || !Array.isArray(student_ids)) {
            return res.status(400).json({ message: 'Invalid or missing fields' });
        }

        // Create a new course
        const newCourse = new Course({
            course_id,
            name,
            teacher_id,
            student_ids,
            cr_ids: [], // No CRs assigned initially
            total_class: 0,
            classes: []
        });

        await newCourse.save();

        // Update the courses_enrolled field in the User collection for each student
        const updatePromises = student_ids.map(async (student_id) => {

            return User.findOneAndUpdate(
                { uni_id: student_id }, // Match by unique student ID
                { $addToSet: { courses_enrolled: course_id } }, // Add course_id if not already present
                { new: true } // Return the updated document
            );
        });

        // Wait for all updates to complete
        await Promise.all(updatePromises);

        try {
            const updatedTeacher = await Teacher.findOneAndUpdate(
                { teacher_id: teacher_id }, // Match by teacher ID (string)
                { $addToSet: { assigned_courses: course_id } }, // Add the course_id to assigned_courses if not already present
                { new: true } // Return the updated teacher document
            );

            // Check if the teacher was found and updated
            if (updatedTeacher) {
                console.log('Teacher updated successfully');
            } else {
                console.log('Teacher not found');
            }
        } catch (error) {
            console.error('Error updating teacher:', error.message);
        }

        res.status(201).json({ message: 'Course created successfully', course: newCourse });
    } catch (error) {
        res.status(500).json({ message: 'Error creating course', error: error.message });
    }
});

// Route to get all courses
router.get('/', async (req, res) => {
    try {
        const courses = await Course.find();
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
});

router.post('/addSchedule', async (req, res) => {
    const { course_id, date, start_time, end_time } = req.body;

    try {
        // Convert start and end times to Date objects for comparison (assuming same date)
        const newStart = new Date(`${date}T${start_time}:00`);
        const newEnd = new Date(`${date}T${end_time}:00`);

        // Find schedules for the same course and date
        const existingSchedules = await Schedule.find({
            course_id,
            date
        });

        // Check for overlap with existing schedules
        for (let schedule of existingSchedules) {
            const existingStart = new Date(`${schedule.date}T${schedule.start_time}:00`);
            const existingEnd = new Date(`${schedule.date}T${schedule.end_time}:00`);

            if (isTimeOverlap(existingStart, existingEnd, newStart, newEnd)) {
                return res.status(400).json({ message: 'Schedule time overlaps with an existing schedule' });
            }
        }

        // If no overlap, create the new schedule

        const newSchedule = new Schedule({
            course_id,
            date,
            start_time,
            end_time
        });

        await newSchedule.save();

        const course = await Course.findOne({ course_id });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        course.total_class += 1;

        // Add the new class date to the classes array and initialize attendance and presence status for each student
        const newClass = {
            class_date: new Date(date),
            attendance: course.student_ids.map(student_id => ({
                student_id,
                times: []  // Initialize an empty list for times the student was present
            })),
            is_present: course.student_ids.map(student_id => ({
                student_id,
                present: false  // Initialize an empty list for present flags for the student
            }))
        };

        course.classes.push(newClass);

        // Save the updated course document
        await course.save();

        res.status(201).json({ message: 'Schedule created successfully', schedule: newSchedule });
    } catch (error) {
        res.status(500).json({ message: 'Error creating schedule', error: error.message });
    }
});


module.exports = router;
