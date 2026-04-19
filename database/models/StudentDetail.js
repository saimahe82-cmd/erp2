const mongoose = require('mongoose');

const studentDetailSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    personalPhone: { type: String },
    phone: { type: String },
    vertical: { type: String },
    section: { type: String },
    cgpa: { type: Number },
    attendance: { type: Number },
    dob: { type: Date },
    bloodGroup: { type: String },
    caste: { type: String },
    community: { type: String },
    gender: { type: String },
    address: { type: String },
    
    // Socials
    leetcode: { type: String },
    linkedin: { type: String },
    github: { type: String },
    
    // Family
    fatherName: { type: String },
    fatherPhone: { type: String },
    fatherOccupation: { type: String },
    fatherIncome: { type: Number },
    motherName: { type: String },
    motherPhone: { type: String },
    motherOccupation: { type: String },
    motherIncome: { type: Number },
    
    siblings: [{
        name: String,
        status: String,
        detail: String
    }],

    // Academics
    sslcSchool: { type: String },
    sslcPlace: { type: String },
    sslcGained: { type: Number },
    sslcTotal: { type: Number },
    hscSchool: { type: String },
    hscPlace: { type: String },
    hscGained: { type: Number },
    hscTotal: { type: Number },
    diplomaApplicable: { type: Boolean, default: false },
    diplomaSchool: { type: String },
    diplomaPlace: { type: String },
    diplomaGained: { type: Number },
    diplomaTotal: { type: Number },
    
    currentSemester: { type: String },
    semesterGPAs: { type: Object } // can store dynamic structure for sem1..sem8, marksheet, courses
}, { timestamps: true });

module.exports = mongoose.model('StudentDetail', studentDetailSchema);
