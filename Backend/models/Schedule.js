const mongoose = require('mongoose');

// Define the Schedule schema
const scheduleSchema = new mongoose.Schema({
    course_id: {
        type: String,
        required: true,
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true,
    },
    start_time: {
        type: String, // Format: HH:mm
        required: true,
    },
    end_time: {
        type: String, // Format: HH:mm
        required: true,
    }
});

// Create the Schedule model based on the schema
const Schedule = mongoose.model('Schedule', scheduleSchema);

module.exports = Schedule;
