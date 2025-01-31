const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User')
const Schedule = require('../models/Schedule');
const Teacher = require('../models/Teacher')
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit'); 
const axios = require('axios');


const mockAttendanceData = {
    name: 'AI',
    classDates: ['2025-01-31', '2025-02-01'],
    studentIds: ['2020331067', '2020331048', '2020331017', '2020331001', '2020331023', '2020331097'],
    studentAttendance: [
        [false, true],  // 2020331067
        [false, false], // 2020331048
        [false, false], // 2020331017
        [false, false], // 2020331001
        [false, false], // 2020331023
        [false, false]  // 2020331097
    ]
};


router.get('/generate_attendance_report/:courseId', async (req, res) => {
    const { courseId } = req.params;

    try {
        // Fetch attendance data from the API
        const response = await axios.get(`http://localhost:5000/courses/get_attendance/${courseId}`);
        const attendanceData = response.data;

        if (!attendanceData) {
            return res.status(404).json({ message: 'Attendance data not found' });
        }

        // Create the reports directory if it doesn't exist
        const reportsDir = path.join(__dirname, '..','reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }   

        // Create a new PDF document
        const doc = new PDFDocument({ margin: 50 });
        const timestamp = Date.now(); // Get the current timestamp
        const filePath = path.join(reportsDir, `attendance_report_${timestamp}.pdf`);

        // Create the stream for the PDF file
        doc.pipe(fs.createWriteStream(filePath));

        // Add a title with proper styling
        // doc.fontSize(24)
        //     .font('Helvetica-Bold')
        //     .fillColor('#2c3e50') // Dark blue color
        //     .text(`Attendance Report for ${attendanceData.name}`, { align: 'center' });

        // Add a subtitle with course ID
        doc.fontSize(14)
            .font('Helvetica')
            .fillColor('#34495e') // Slightly lighter blue
            .text(`Course Code: ${courseId}`, { align: 'center' });

        // Define table dimensions
        const tableTop = 80;
        const rowHeight = 25;
        const leftMargin = 20;

        // Calculate the number of columns (excluding the first one)
        const numColumns = attendanceData.classDates.length + 3; // Dates + Total Classes + Present + Percentage

        // Calculate the available width for the table
        const pageWidth = doc.page.width - 2 * leftMargin; // Subtract left and right margins
        const colWidth = pageWidth / (numColumns + 1); // Divide by number of columns (including the first one)

        // Draw table headers with proper styling
        doc.fontSize(12)
            .font('Helvetica-Bold')
            .rect(leftMargin, tableTop, (numColumns + 1) * colWidth, rowHeight)
            .fillAndStroke('#3498db', '#3498db'); // Blue background and border

        // Add "Student ID" text
        doc.fillColor('#ffffff') // White text
            .text('Student ID', leftMargin + 10, tableTop + 10);

        // Add date texts
        attendanceData.classDates.forEach((date, index) => {
            // Extract month and date from the date string
            const formattedDate = date.slice(5); // Remove the year (first 4 characters and the hyphen)

            doc.fillColor('#ffffff') // White text
                .text(formattedDate, leftMargin + (index + 1) * colWidth + 10, tableTop + 10);
        });

        // Add new column headers
        doc.fillColor('#ffffff') // White text
            .text('TC', leftMargin + (attendanceData.classDates.length + 1) * colWidth + 10, tableTop + 10)
            .text('P', leftMargin + (attendanceData.classDates.length + 2) * colWidth + 10, tableTop + 10)
            .text('%', leftMargin + (attendanceData.classDates.length + 3) * colWidth + 10, tableTop + 10);

        // Draw table rows with alternating colors for better readability
        doc.font('Helvetica')
            .fillColor('#2c3e50'); // Dark blue text
        attendanceData.studentIds.forEach((studentId, rowIndex) => {
            const y = tableTop + (rowIndex + 1) * rowHeight;

            // Alternate row background color
            if (rowIndex % 2 === 0) {
                doc.rect(leftMargin, y, (numColumns + 1) * colWidth, rowHeight)
                    .fillAndStroke('#ecf0f1', '#ecf0f1'); // Light gray background
            } else {
                doc.rect(leftMargin, y, (numColumns + 1) * colWidth, rowHeight)
                    .fillAndStroke('#ffffff', '#ffffff'); // White background
            }

            // Add student ID
            doc.fillColor('#2c3e50') // Dark blue text
                .text(studentId, leftMargin + 10, y + 10);

            // Add attendance marks
            attendanceData.studentAttendance[rowIndex].forEach((attendance, colIndex) => {
                const x = leftMargin + (colIndex + 1) * colWidth + 10;

                // Set font size smaller for P and A
                doc.fontSize(10);

                // Set color based on attendance
                if (attendance) {
                    doc.fillColor('#27ae60'); // Green for Present
                } else {
                    doc.fillColor('#e74c3c'); // Red for Absent
                }

                // Add P or A
                doc.text(attendance ? 'P' : 'A', x, y + 10);

                // Reset font size and color for other text
                doc.fontSize(12).fillColor('#2c3e50'); // Reset to default
            });

            // Calculate total classes, present classes, and attendance percentage
            const totalClasses = attendanceData.classDates.length;
            const presentClasses = attendanceData.studentAttendance[rowIndex].filter((attendance) => attendance).length;
            const attendancePercentage = ((presentClasses / totalClasses) * 100).toFixed(2);

            // Add total classes
            doc.fillColor('#2c3e50') // Dark blue text
                .text(totalClasses.toString(), leftMargin + (attendanceData.classDates.length + 1) * colWidth + 10, y + 10);

            // Add present classes
            doc.fillColor('#2c3e50') // Dark blue text
                .text(presentClasses.toString(), leftMargin + (attendanceData.classDates.length + 2) * colWidth + 10, y + 10);

            // Add attendance percentage
            doc.fillColor('#2c3e50') // Dark blue text
                .text(`${attendancePercentage}%`, leftMargin + (attendanceData.classDates.length + 3) * colWidth + 10, y + 10);
        });

        // Draw table borders
        doc.lineWidth(1)
            .strokeColor('#bdc3c7') // Light gray border
            .rect(leftMargin, tableTop, (numColumns + 1) * colWidth, (attendanceData.studentIds.length + 1) * rowHeight)
            .stroke();

        // Add a footer with the generation date
        const footerText = `Report generated on: ${new Date().toLocaleDateString()}`;
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor('#7f8c8d') // Gray text
            .text(footerText, { align: 'center', width: doc.page.width - 100, height: 50 });

        // Finalize the PDF and save it to the file system
        doc.end();

        // Send the path of the saved PDF as the response
        res.json({ filePath: `/reports/attendance_report_${timestamp}.pdf` });

    } catch (err) {
        console.error('Error generating PDF:', err);
        res.status(500).json({ message: 'Error generating PDF' });
    }
});


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


router.get('/get_attendance/:course_id', async (req, res) => {
    const { course_id } = req.params;

    try {
        // Find the course by its ID
        const course = await Course.findOne({ course_id: course_id });
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const studentIds = course.student_ids;

        let studentAttendance = studentIds.map(() => []);
        let classDates = []; 


        course.classes.forEach((classData) => {
            const { class_date, is_present } = classData; 

            classDates.push(class_date.toISOString().split('T')[0]);

            // Loop through the `is_present` array of each class
            is_present.forEach((attendance) => {
                const { student_id, present } = attendance;

                // Find the index of the student in the studentIds array
                const studentIndex = studentIds.indexOf(student_id);

                if (studentIndex !== -1) {
                    // Add the attendance status (boolean) to the student's attendance list
                    studentAttendance[studentIndex].push(present);
                }
            });
        });

        studentIds.forEach((student_id, index) => {
            console.log(`Student ID: ${student_id}`);
            console.log(`Attendance: ${JSON.stringify(studentAttendance[index])}`);
        });
        
        res.status(200).json({
            name: course.name,
            studentIds: studentIds,
            classDates: classDates,
            studentAttendance:studentAttendance
        });
    } catch (error) {
        // Handle server errors
        res.status(500).json({ message: 'Error fetching course', error: error.message });
    }
});




module.exports = router;
