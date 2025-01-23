const express = require('express');
const Schedule = require('../models/Schedule');
const Course = require('../models/Course');
const router = express.Router();

router.post('/result', async (req, res) => {
    try {
        const result = req.body.result; // List of student IDs who are present
        const currentTime = new Date(); // Get the current date and time

        // Format the current date to match the format in the database ("YYYY-MM-DD")
        const currentDate = currentTime.toISOString().split('T')[0];

        // Format the current time as "HH:mm"
        const currentTimeStr = currentTime.toTimeString().split(' ')[0].substring(0, 5);

        console.log("Current Date:", currentDate);
        console.log("Current Time:", currentTimeStr);

        // Find the course where the current date matches and time is between start_time and end_time
        const schedule = await Schedule.findOne({
            date: currentDate,
            start_time: { $lte: currentTimeStr }, // start_time <= current time
            end_time: { $gte: currentTimeStr }   // end_time >= current time
        });

        if (!schedule) {
            return res.status(404).json({ message: 'No class found for today.' });
        }

        const course = await Course.findOne({ course_id: schedule.course_id });

        console.log(course.name);
        

        res.status(200).json({
            message: 'Attendance updated successfully.',
            result: result,
            current_date: currentDate,
            course_id: course.course_id,
            name:course.name
        });
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({ message: 'Internal server error.', error: error.message });
    }
});

module.exports = router;
