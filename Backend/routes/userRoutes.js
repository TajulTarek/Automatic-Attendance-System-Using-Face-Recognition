const express = require('express');
const User = require('../models/User');
const Course = require('../models/Course');
const Schedule=require('../models/Schedule')
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { execFile } = require("child_process");

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
        const name =student.name
        const enrolledCourses = student.courses_enrolled;  // Array of course objects
        //console.log(enrolledCourses)

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
            name:name,
            enrolledCourses: courseDetails,
        });
    } catch (error) {
        console.error('Error fetching student dashboard:', error);
        res.status(500).json({ message: 'Error fetching student dashboard', error: error.message });
    }
});

// Route to handle image upload
router.post("/upload-image", (req, res) => {
    try {
        const { image, ID } = req.body; // Base64 string from frontend
        
        console.log(ID)

        if (!image || !ID) {
            return res.status(400).json({ success: false, message: "Image and ID are required" });
        }

        // Decode base64 and save as a file
        const uploadDir ="C:/Users/tarek/OneDrive/Desktop/Attendance/uploads_photo"
        const buffer = Buffer.from(image, "base64");
        const fileName = `image_${Date.now()}.png`;
        const filePath = path.join(uploadDir, fileName);

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true }); // Create directory if it doesn't exist
        }

        fs.writeFileSync(filePath, buffer);

        // const imageUrl = `http://localhost:5000/uploads/${fileName}`;

        execFile("python", ["C:/Users/tarek/OneDrive/Desktop/Attendance/Server/upload_img.py", filePath, ID], (error, stdout, stderr) => {
            if (error) {
                console.error("Python Error:", stderr);
                return res.status(500).json({ success: false, message: "Error processing image", error: stderr });
            }

            try {
                const pythonResponse = JSON.parse(stdout.trim()); // ✅ Ensure clean JSON parsing
                return res.status(200).json(pythonResponse);
            } catch (parseError) {
                console.error("JSON Parse Error:", stdout); // ✅ Log raw output
                return res.status(500).json({ success: false, message: "Failed to parse Python response", rawOutput: stdout });
            }
        });


    } catch (error) {
        console.error("Error uploading image:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.get("/upcoming/:studentId", async (req, res) => {
    try {
        const studentId = req.params.studentId;

        // 1. Find the student
        const student = await User.findOne({ uni_id: studentId });
        if (!student) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        // 2. Get enrolled courses
        const enrolledCourseIds = student.courses_enrolled;

        // 3. Get the current date and time
        const todayDate = getCurrentDate();
        const currentTime = getCurrentTime();
        // console.log(getCurrentDate(), getCurrentTime());

        
        // 4. Find schedules for enrolled courses with future dates and times
        const upcomingSchedules = await Schedule.find({
            course_id: { $in: enrolledCourseIds },
            $or: [
                { date: { $gt: todayDate } }, // Future dates (after today)
                { date: todayDate, start_time: { $gte: currentTime } } // Today but after the current time
            ]
        }).sort({ date: 1, start_time: 1 }); // Sort by date and start_time ascending

        // 5. Map through schedules to fetch course details
        const upcomingClasses = await Promise.all(upcomingSchedules.map(async (schedule) => {
            const course = await Course.findOne({ course_id: schedule.course_id });

            return {
                course_id: course.course_id,
                course_name: course.name,
                date: schedule.date,
                start_time: schedule.start_time,
                end_time: schedule.end_time
            };
        }));

        res.json({ success: true, upcomingClasses });

    } catch (error) {
        console.error("Error fetching upcoming classes:", error);
        res.status(500).json({ success: false, message: "Error fetching upcoming classes" });
    }
});





module.exports = router;
