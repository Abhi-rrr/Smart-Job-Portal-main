const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  industry: String,
  jobType: String,
  salaryMin: Number,
  salaryMax: Number,
  description: String,
  requirements: String,
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recruiter'
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);

