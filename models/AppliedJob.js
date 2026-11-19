const mongoose = require('mongoose');

const appliedJobSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  title: String,
  company: String,
  location: String,
  category: String,
  type: String,
  description: String,
  salary: String,
  requirements: String,
  createdAt: { type: Date, default: Date.now }
});

// Prevent multiple applications to the same job by same user
appliedJobSchema.index({ user: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('AppliedJob', appliedJobSchema);
