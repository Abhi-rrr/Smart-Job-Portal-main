const mongoose = require('mongoose');

const recruiterSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        minlength: [3, 'Username must be at least 3 characters long']
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        minlength: [13, 'Email must be at least 13 characters long']
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: [5, 'Password must be at least 5 characters long']
    },
    role: {
        type: String,
        enum: ['recruiter'],
        default: 'recruiter'
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    phoneNo: {
        type: String,
        trim: true
    },
    companyName: {
        type: String,
        trim: true,
        default: '' , // Optional initially
        required:false,
    },
    companyField: {
        type: String,
        trim: true,
        default: '',
        required:false,

    },
    hrPhone: {
        type: String,
        trim: true,
        default: '',
        required:false,

    }
});

const Recruiter = mongoose.model('Recruiter', recruiterSchema);
module.exports = Recruiter;
