const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true }, // e.g., 'Sick', 'Casual', 'On-Duty', 'Event'
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    facultyStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    hodStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    odProof: { type: String }, // Base64 or URL
    odCertificate: { type: String },
    medicalCertificate: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
