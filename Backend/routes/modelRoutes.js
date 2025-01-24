const express = require('express');
const Schedule = require('../models/Schedule');
const Course = require('../models/Course');
const router = express.Router();

router.post('/result', async (req, res) => {
    try {
        const result = req.body.result; // List of student IDs who are present
        const currentTime = new Date(); // Get the current date and time

        console.log(result)

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

        const classForToday = course.classes.find(c => c.class_date.toISOString().split('T')[0] === currentDate);

        console.log(classForToday.class_date)



        if (!classForToday) {
            return res.status(404).json({ message: 'No class scheduled for today.' });
        }
        const present_student_ids = result;

        for (const present_student_id of present_student_ids) {

            const present_student_Record = classForToday.attendance.find(a => a.student_id === present_student_id);
            const present_student_att = classForToday.is_present.find(a => a.student_id === present_student_id);

            if (present_student_Record) {
                // Add the current time to the times array of the attendance record
                present_student_Record.times.push(currentTimeStr);

                const times = present_student_Record.times;
                if (times.length >= 2) {
                    const firstTime = new Date(`1970-01-01T${times[0]}Z`); // 
                    const lastTime = new Date(`1970-01-01T${times[times.length - 1]}Z`); 

                    const timeDifferenceInMinutes = (lastTime - firstTime)/60000;

                    if (timeDifferenceInMinutes >= 1) {
                        present_student_att.present = true; // Update the present status
                    }
                }
                // Save the updated attendance record
                await course.save();

                console.log(`Current time added to attendance record with ID: ${present_student_id}`);
            } else {
                console.log(`Attendance record not found for ID: ${present_student_id}`);
            }
        }

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
