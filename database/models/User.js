const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    role: { type: String, enum: ['student', 'faculty', 'hod', 'admin'], required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: String },
    year: { type: String }, // For students
    registerNo: { type: String },
    profileImage: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
