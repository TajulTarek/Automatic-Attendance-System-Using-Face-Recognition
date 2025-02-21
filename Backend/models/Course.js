const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        course_id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        teacher_id: { type: String, required: true },
        cr_ids: [{ type: String }], // Optional, for course representatives
        student_ids: [{ type: String, required: true }], // List of enrolled student IDs
        total_class: { type: Number, default: 0 }, // Total number of classes
        classes: [
            {
                all_times: [{ type: String }],
                class_date: { type: Date, required: true }, // Date of the class
                attendance: [
                    {
                        student_id: { type: String, required: true },
                        times: [{ type: String }] // List of times when the student was detected
                    }
                ],
                is_present: [
                    {
                        student_id: { type: String, required: true },
                        present: { type: Boolean } 
                    }
                ]
            }
        ]
    }
);

module.exports = mongoose.model('Course', courseSchema);
