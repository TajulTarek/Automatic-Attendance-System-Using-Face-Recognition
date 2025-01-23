const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
    {
        teacher_id: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        password: { type: String, required: true },
        assigned_courses: [{ type: String }]  
    }
);

module.exports = mongoose.model('Teacher', teacherSchema);
