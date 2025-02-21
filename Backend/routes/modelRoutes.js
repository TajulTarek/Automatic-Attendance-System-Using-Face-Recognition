const express = require('express');
const Schedule = require('../models/Schedule');
const Course = require('../models/Course');
const RoomToCourse = require('../models/RoomToCourse');
const router = express.Router();

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
        second: '2-digit',
        hour12: false,
    });

    const [{ value: hour }, , { value: minute }, , { value: second }] = formatter.formatToParts(now);

    // Ensure that the hour doesn't exceed 23 (24:00 -> 00:00)
    let adjustedHour = parseInt(hour);
    if (adjustedHour >= 24) {
        adjustedHour -= 24;
    }

    // Format the hour to ensure two digits
    adjustedHour = adjustedHour < 10 ? `0${adjustedHour}` : adjustedHour;

    return `${adjustedHour}:${minute}:${second}`; // Return HH:mm:ss
};

console.log(getCurrentTime());



router.post('/result', async (req, res) => {
    try {
        const result = req.body.result; // List of student IDs who are present
        const room_no = req.body.room_no;
        const currentTime = new Date(); // Get the current date and time

        console.log(result)

        // Format the current date to match the format in the database ("YYYY-MM-DD")
        const currentDate = getCurrentDate()

        // Format the current time as "HH:mm"
        const currentTimeStr = getCurrentTime()

        console.log("Current Date:", currentDate);
        console.log("Current Time:", currentTimeStr);

        // Find the course where the current date matches and time is between start_time and end_time
        const room = await RoomToCourse.findOne({ room_id:room_no });

        const course = await Course.findOne({ course_id: room.current_course_id });
        
        if (!course) {
            throw new Error('Course not found');
        }

        const class_id = room.class_id;

        const classForToday = course.classes.id(class_id);  // Assuming class_id is an ObjectId

        if (!classForToday) {
            throw new Error('Class not found');
        }

        // Now `classForToday` holds the class object from the `classes` sub-collection
        // console.log(classForToday);

        // console.log(course.name);


        // console.log(classForToday.class_date)



        if (!classForToday) {
            return res.status(404).json({ message: 'No class scheduled for today.' });
        }
        const present_student_ids = result;

        classForToday.all_times.push(currentTimeStr)
        await course.save();
        
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
