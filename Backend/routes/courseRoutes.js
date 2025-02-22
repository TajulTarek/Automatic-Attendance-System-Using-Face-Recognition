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
const RoomToCourse = require('../models/RoomToCourse');
const mongoose = require('mongoose');
const pdf = require('html-pdf');
const puppeteer = require('puppeteer');



router.get('/generate_attendance_report/:courseId', async (req, res) => {
    const { courseId } = req.params;
    const { requiredMinutes } = req.query;

    console.log("Required Minutes:", requiredMinutes);

    try {
        // Fetch attendance data from the API
        const response = await axios.get(`${process.env.URL}/courses/get_attendance/${courseId}`);
        const attendanceData = response.data;

        if (!attendanceData) {
            return res.status(404).json({ message: 'Attendance data not found' });
        }

        // Create the reports directory if it doesn't exist
        const reportsDir = path.join(__dirname, '..', 'reports');
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
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .fillColor('#2c3e50') // Dark blue color
            .text(`Attendance Report for ${attendanceData.name}`, { align: 'center' });

        // Add a subtitle with course ID
        doc.fontSize(12)
            .font('Helvetica')
            .fillColor('#34495e') // Slightly lighter blue
            .text(`Course Code: ${courseId}`, { align: 'center' });

        // Define table dimensions
        const tableTop = 100;
        const rowHeight = 25;
        const leftMargin = 40;

        // Calculate the number of columns (including Student ID, Dates, TC, Total Ratio, %, Marks)
        const numColumns = attendanceData.classDates.length + 5; // Student ID + Dates + TC + Total Ratio + % + Marks

        // Calculate the available width for the table
        const pageWidth = doc.page.width - 2 * leftMargin; // Subtract left and right margins
        const colWidth = pageWidth / numColumns; // Divide by number of columns

        // Draw table headers with proper styling
        doc.fontSize(8)
            .font('Helvetica-Bold')
            .rect(leftMargin, tableTop, numColumns * colWidth, rowHeight)
            .fillAndStroke('#2ecc71', '#2ecc71'); // Light green background and border

        // Add column headers
        doc.fillColor('#ffffff') // White text
            .text('Student ID', leftMargin + 10, tableTop + 10);

        attendanceData.classDates.forEach((date, index) => {
            const formattedDate = date.slice(5); // Remove the year (first 4 characters and the hyphen)
            doc.text(formattedDate, leftMargin + (index + 1) * colWidth + 10, tableTop + 10);
        });

        doc.text('Total Att', leftMargin + (attendanceData.classDates.length + 2) * colWidth + 10, tableTop + 10)
            .text('Total Class', leftMargin + (attendanceData.classDates.length + 1) * colWidth + 10, tableTop + 10)
            .text('Percentage', leftMargin + (attendanceData.classDates.length + 3) * colWidth + 10, tableTop + 10)
            .text('Marks', leftMargin + (attendanceData.classDates.length + 4) * colWidth + 10, tableTop + 10);

        // Draw table rows with alternating colors for better readability
        doc.font('Helvetica')
            .fillColor('#2c3e50'); // Dark blue text
        attendanceData.studentIds.forEach((studentId, rowIndex) => {
            const y = tableTop + (rowIndex + 1) * rowHeight;

            // Alternate row background color
            if (rowIndex % 2 === 0) {
                doc.rect(leftMargin, y, numColumns * colWidth, rowHeight)
                    .fillAndStroke('#ecf0f1', '#ecf0f1'); // Light gray background
            } else {
                doc.rect(leftMargin, y, numColumns * colWidth, rowHeight)
                    .fillAndStroke('#ffffff', '#ffffff'); // White background
            }

            // Add student ID
            doc.fillColor('#2c3e50') // Dark blue text
                .text(studentId, leftMargin + 10, y + 10);

            // Add attendance marks
            const attendanceRow = attendanceData.studentAttendance[rowIndex];
            const totalClasses = attendanceData.classDates.length;

            // Calculate the ratio for each class
            const ratios = attendanceRow.map((attendance) => {
                if (!attendance || attendance.length === 0) {
                    return 0; // Absent (ratio = 0)
                }

                // Ensure requiredMinutes is a valid number
                const requiredMinutesNum = Number(requiredMinutes);
                if (isNaN(requiredMinutesNum)) {
                    return 0; // Invalid requiredMinutes, treat as absent
                }

                // Calculate the difference between first and last timestamp
                const firstTime = attendance[0];
                const lastTime = attendance[attendance.length - 1];
                const timeToMinutes = (time) => {
                    const [hours, minutes] = time.split(":").map(Number);
                    if (isNaN(hours) || isNaN(minutes)) {
                        return NaN; // Handle invalid timestamp format
                    }
                    return hours * 60 + minutes;
                };

                const firstTimeMinutes = timeToMinutes(firstTime);
                const lastTimeMinutes = timeToMinutes(lastTime);
                if (isNaN(firstTimeMinutes) || isNaN(lastTimeMinutes)) {
                    return 0; // Invalid timestamps, treat as absent
                }

                const timeDiff = lastTimeMinutes - firstTimeMinutes;
                return Math.min(timeDiff / requiredMinutesNum, 1); // Clamp ratio to [0, 1]
            });

            // Add attendance ratios
            ratios.forEach((ratio, colIndex) => {
                const x = leftMargin + (colIndex + 1) * colWidth + 10;
                doc.fontSize(8)
                    .fillColor(ratio > 0 ? '#27ae60' : '#e74c3c') // Green for Present, Red for Absent
                    .text(ratio.toFixed(1), x, y + 10);
            });

            // Calculate total ratio and percentage
            const totalRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) / totalClasses;
            const attendancePercentage = (totalRatio * 100).toFixed(2);

            // Calculate marks based on attendancePercentage
            let marks = 0;
            if (attendancePercentage >= 95) {
                marks = 10;
            } else if (attendancePercentage >= 90) {
                marks = 9;
            } else if (attendancePercentage >= 85) {
                marks = 8;
            } else if (attendancePercentage >= 80) {
                marks = 7;
            } else if (attendancePercentage >= 75) {
                marks = 6;
            } else if (attendancePercentage >= 70) {
                marks = 5;
            } else if (attendancePercentage >= 65) {
                marks = 4;
            } else if (attendancePercentage >= 60) {
                marks = 3;
            } else {
                marks = 0;
            }

            // Add total classes, total ratio, attendance percentage, and marks
            doc.fontSize(8)
                .fillColor('#2c3e50') // Dark blue text
                .text(totalRatio.toFixed(1), leftMargin + (attendanceData.classDates.length + 2) * colWidth + 10, y + 10)
                .text(totalClasses.toString(), leftMargin + (attendanceData.classDates.length + 1) * colWidth + 10, y + 10)
                .text(`${attendancePercentage}%`, leftMargin + (attendanceData.classDates.length + 3) * colWidth + 10, y + 10)
                .text(marks.toString(), leftMargin + (attendanceData.classDates.length + 4) * colWidth + 10, y + 10);
        });

        // Draw table borders
        doc.lineWidth(1)
            .strokeColor('#bdc3c7') // Light gray border
            .rect(leftMargin, tableTop, numColumns * colWidth, (attendanceData.studentIds.length + 1) * rowHeight)
            .stroke();

        // Add a footer with the generation date
        const footerText = `Report generated on: ${new Date().toLocaleDateString()}`;
        doc.fontSize(8)
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



router.get('/generate_attendance_report_html/:courseId', async (req, res) => {
    const { courseId } = req.params;
    const { requiredMinutes } = req.query; // Ensure this is passed as a query parameter
    console.log("min ",requiredMinutes);

    try {
        // Fetch attendance data from the API
        const response = await axios.get(`${process.env.URL}/courses/get_attendance/${courseId}`);
        const attendanceData = response.data;

        if (!attendanceData) {
            return res.status(404).json({ message: 'Attendance data not found' });
        }

        // Create the reports directory if it doesn't exist
        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        // Generate HTML content for the PDF
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Attendance Report</title>
                <style>
                    body {
                        font-family: 'Arial', sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: #f8f9fa;
                    }
                    .container {
                        background-color: #ffffff;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        border-radius: 8px;
                        overflow: hidden;
                        width: fit-content; /* Adjust width based on content */
                    }
                    h1 {
                        text-align: center;
                        color: #202124;
                        font-size: 24px;
                        font-weight: 600;
                        margin: 20px 0;
                    }
                    h2 {
                        text-align: center;
                        color: #5f6368;
                        font-size: 18px;
                        font-weight: 500;
                        margin-bottom: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        background-color: #ffffff;
                    }
                    th, td {
                        padding: 12px 15px;
                        text-align: center;
                        border: 1px solid #e0e0e0;
                        font-size: 14px;
                    }
                    th {
                        background-color: #f1f3f4;
                        color: #202124;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }
                    tr:hover {
                        background-color: #f1f3f4;
                    }
                    .present {
                        color: #34a853;
                        font-weight: 600;
                    }
                    .absent {
                        color: #ea4335;
                        font-weight: 600;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        padding: 10px;
                        color: #5f6368;
                        font-size: 12px;
                        border-top: 1px solid #e0e0e0;
                        background-color: #f8f9fa;
                    }
                    .highlight {
                        background-color: #e8f0fe;
                        color: #1967d2;
                        font-weight: 600;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Attendance Report for ${attendanceData.name}</h1>
                    <h2>Course Code: ${courseId}</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                ${attendanceData.classDates.map(date => `
                                    <th>${date.slice(5)}</th>
                                `).join('')}
                                <th class="highlight">TC</th>
                                <th class="highlight">Total Ratio</th>
                                <th class="highlight">%</th>
                                <th class="highlight">Marks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${attendanceData.studentIds.map((studentId, rowIndex) => {
            const attendanceRow = attendanceData.studentAttendance[rowIndex];
            const totalClasses = attendanceData.classDates.length;

            // Calculate the ratio for each class
            const ratios = attendanceRow.map((attendance) => {
                if (!attendance || attendance.length === 0) {
                    return 0; // Absent (ratio = 0)
                }

                // Ensure requiredMinutes is a valid number
                const requiredMinutesNum = Number(requiredMinutes);
                if (isNaN(requiredMinutesNum)) {
                    return 0; // Invalid requiredMinutes, treat as absent
                }

                // Calculate the difference between first and last timestamp
                const firstTime = attendance[0];
                const lastTime = attendance[attendance.length - 1];
                const timeToMinutes = (time) => {
                    const [hours, minutes] = time.split(":").map(Number);
                    if (isNaN(hours) || isNaN(minutes)) {
                        return NaN; // Handle invalid timestamp format
                    }
                    return hours * 60 + minutes;
                };

                const firstTimeMinutes = timeToMinutes(firstTime);
                const lastTimeMinutes = timeToMinutes(lastTime);
                if (isNaN(firstTimeMinutes) || isNaN(lastTimeMinutes)) {
                    return 0; // Invalid timestamps, treat as absent
                }

                const timeDiff = lastTimeMinutes - firstTimeMinutes;
                return Math.min(timeDiff / requiredMinutesNum, 1); // Clamp ratio to [0, 1]
            });

            // Calculate total ratio and percentage
            const totalRatio = ratios.reduce((sum, ratio) => sum + ratio, 0) / totalClasses;
            const attendancePercentage = (totalRatio * 100).toFixed(2);

            // Calculate marks based on attendancePercentage
            let marks = 0;
            if (attendancePercentage >= 95) {
                marks = 10;
            } else if (attendancePercentage >= 90) {
                marks = 9;
            } else if (attendancePercentage >= 85) {
                marks = 8;
            } else if (attendancePercentage >= 80) {
                marks = 7;
            } else if (attendancePercentage >= 75) {
                marks = 6;
            } else if (attendancePercentage >= 70) {
                marks = 5;
            } else if (attendancePercentage >= 65) {
                marks = 4;
            } else if (attendancePercentage >= 60) {
                marks = 3;
            } else {
                marks = 0;
            }

            return `
                                    <tr>
                                        <td>${studentId}</td>
                                        ${ratios.map(ratio => `
                                            <td class="${ratio > 0 ? 'present' : 'absent'}">
                                                ${ratio.toFixed(1)}
                                            </td>
                                        `).join('')}
                                        <td class="highlight">${totalClasses}</td>
                                        <td class="highlight">${totalRatio.toFixed(1)}</td>
                                        <td class="highlight">${attendancePercentage}%</td>
                                        <td class="highlight">${marks}</td>
                                    </tr>
                                `;
        }).join('')}
                        </tbody>
                    </table>
                    <div class="footer">
                        Report generated on: ${new Date().toLocaleDateString()}
                    </div>
                </div>
            </body>
            </html>
        `;

        // Calculate the required width based on the number of columns
        const numColumns = attendanceData.classDates.length + 5; // Student ID + Dates + TC + Total Ratio + % + Marks
        const columnWidth = 100; // Approximate width of each column in pixels
        const pageWidth = numColumns * columnWidth;

        // Options for html-pdf
        const pdfOptions = {
            format: {
                width: `${pageWidth}px`, // Set dynamic width
                height: 'auto', // Let the height adjust automatically
            },
            border: {
                top: '20mm',
                right: '10mm',
                bottom: '20mm',
                left: '10mm'
            }
        };

        // Generate PDF from HTML
        pdf.create(htmlContent, pdfOptions).toFile(path.join(reportsDir, `attendance_report_${Date.now()}.pdf`), (err, result) => {
            if (err) {
                console.error('Error generating PDF:', err);
                return res.status(500).json({ message: 'Error generating PDF', error: err.message });
            }

            // Extract the relative path starting from the "reports" directory
            const fullPath = result.filename;
            const reportsIndex = fullPath.indexOf('reports');
            const relativePath = fullPath.slice(reportsIndex - 1);

            // Send the relative path as the response
            res.json({ filePath: relativePath });
        });
    } catch (err) {
        console.error('Error calling the generating PDF api:', err);
        res.status(500).json({ message: 'Error calling the generating PDF api' });
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
            const { class_date, attendance } = classData;

            classDates.push(class_date.toISOString().split('T')[0]);

            // Loop through the `is_present` array of each class
            attendance.forEach((times_obj) => {
                const { student_id, times } = times_obj;

                // Find the index of the student in the studentIds array
                const studentIndex = studentIds.indexOf(student_id);

                if (studentIndex !== -1) {
                    // Add the attendance status (boolean) to the student's attendance list
                    studentAttendance[studentIndex].push(times);
                }
            });
        });

        // studentIds.forEach((student_id, index) => {
        //     console.log(`Student ID: ${student_id}`);
        //     console.log(`Attendance: ${JSON.stringify(studentAttendance[index])}`);
        // });

        res.status(200).json({
            name: course.name,
            studentIds: studentIds,
            classDates: classDates,
            studentAttendance: studentAttendance
        });
    } catch (error) {
        // Handle server errors
        res.status(500).json({ message: 'Error fetching course', error: error.message });
    }
});


router.post('/start-class', async (req, res) => {
    try {
        const { room_id, course_id } = req.body;

        // Check if a class is already running in the room
        let room = await RoomToCourse.findOne({ room_id });

        if (room && room.current_course_id) {
            return res.status(400).json({ success: false, message: "A class is already running in this room." });
        }

        // Find the course details
        const course = await Course.findOne({ course_id: course_id });
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found." });
        }

        course.total_class += 1;


        const newClass = {
            _id: new mongoose.Types.ObjectId(),
            all_times: [],
            class_date: new Date(new Date().getTime() + 6 * 60 * 60 * 1000), // Converts to GMT+6
            attendance: course.student_ids.map(student_id => ({
                student_id,
                times: []  // Initialize an empty list for times the student was present
            })),
            is_present: course.student_ids.map(student_id => ({
                student_id,
                present: false  // Initialize the present flag as false for each student
            }))
        };


        course.classes.push(newClass);

        // Save the updated course document
        await course.save();

        if (!room) {
            room = new RoomToCourse({ room_id, current_course_id: course_id, class_id: newClass._id });
        } else {
            room.current_course_id = course_id;
            room.class_id = newClass._id;
        }

        await room.save();

        res.json({ success: true, message: `Class for ${course.name} started in room ${room_id}.` });

    } catch (error) {
        console.error("Error starting class:", error);
        res.status(500).json({ success: false, message: "Error starting class." });
    }
});


router.get('/rooms', async (req, res) => {
    try {
        const rooms = await RoomToCourse.find();
        res.status(200).json(rooms);
    } catch (error) {
        console.error('Error fetching room data:', error);
        res.status(500).json({ success: false, message: 'Error fetching room data' });
    }
});

// routes/courses.js
router.post('/end-class', async (req, res) => {
    try {
        const { room_id, course_id } = req.body;

        // Find the room where the class is running
        let room = await RoomToCourse.findOne({ room_id });

        if (!room || room.current_course_id !== course_id) {
            return res.status(400).json({ success: false, message: 'No class is running in this room or the course does not match.' });
        }

        // Set current_course_id and class_id to null
        room.current_course_id = null;
        room.class_id = null;

        // Save the room with the updated values
        await room.save();

        // Optionally, you may want to mark the course as no longer running by updating its status in the Course model

        res.json({ success: true, message: `Class for ${course_id} has been ended.` });
    } catch (error) {
        console.error('Error ending class:', error);
        res.status(500).json({ success: false, message: 'Error ending class.' });
    }
});



module.exports = router;
