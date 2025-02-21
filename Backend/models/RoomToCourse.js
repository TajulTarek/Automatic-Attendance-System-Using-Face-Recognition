const mongoose = require('mongoose');

const roomToCourseSchema = new mongoose.Schema({
    room_id: { type: String, required: true, unique: true },
    current_course_id: { type: String, default: null }, 
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
});




module.exports = mongoose.model('RoomToCourse', roomToCourseSchema);
