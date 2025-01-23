const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Plaintext password
    role: { type: String, enum: ['Admin', 'Teacher', 'Student'], required: true },
    uni_id: { type: String },
    courses_enrolled: [{ type: String }],
});

module.exports = mongoose.model('User', userSchema);
