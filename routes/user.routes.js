const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Recruiter = require('../models/recruiter.model');
const Job = require('../models/job.model');
const AppliedJob = require('../models/AppliedJob');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


// Test route
router.get('/test', (req, res) => res.send('user Test route'));

// Auth: Register
router.get('/register', (req, res) => res.render('register'));

router.post('/register',
  body('email').trim().isEmail().isLength({ min: 13 }),
  body('password').trim().isLength({ min: 5 }),
  body('username').trim().isLength({ min: 3 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array(), message: 'Invalid data' });
    }

    const { email, username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser;
    if (role === 'recruiter') {
      newUser = await Recruiter.create({ email, username, password: hashedPassword, role });
    } else {
      newUser = await userModel.create({ email, username, password: hashedPassword, role });
    }

    const token = jwt.sign({ userId: newUser._id, email, username, role }, process.env.JWT_SECRET);
    res.cookie('token', token);

    return res.redirect(role === 'recruiter' ? '/user/recruiters_dash' : '/user/dashboard');
  });

// Auth: Login
router.get('/login', (req, res) => res.render('login'));

router.post('/login',
  body('username').trim().isLength({ min: 3 }),
  body('password').trim().isLength({ min: 5 }),
  async (req, res) => {
    const { username, password, role } = req.body;
    if (!role) return res.status(400).send("<script>alert('Role is required'); window.location.href='/user/login';</script>");

    const user = role === 'recruiter'
      ? await Recruiter.findOne({ username })
      : await userModel.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.send("<script>alert('Wrong credentials'); window.location.href='/user/login';</script>");
    }

    const token = jwt.sign({ userId: user._id, email: user.email, username: user.username, role: user.role }, process.env.JWT_SECRET);
    res.cookie('token', token);
    return res.redirect(role === 'recruiter' ? '/user/recruiters_dash' : '/user/dashboard');
  });

// Candidate Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/user/login');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = decoded.role === 'recruiter'
      ? await Recruiter.findById(decoded.userId)
      : await userModel.findById(decoded.userId);

    if (!user) return res.status(404).send("User not found");

    res.render('dashboard', { user });
  } catch (err) {
    console.error(err);
    res.status(401).redirect('/user/login');
  }
});

// Recruiter Dashboard
router.get('/recruiters_dash', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const recruiter = await Recruiter.findById(decoded.userId);

    if (!recruiter) return res.status(404).send('Recruiter not found');

    const jobs = await Job.find({ company: recruiter.companyName });
    res.render('recruiters_dash', { user: recruiter, jobs });
  } catch (err) {
    console.error('Error loading recruiter dashboard:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Update Profiles
router.post('/update-profile', async (req, res) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const updateData = (({ firstName, lastName, phoneNo }) => ({ firstName, lastName, phoneNo }))(req.body);

    const updatedUser = decoded.role === 'recruiter'
      ? await Recruiter.findByIdAndUpdate(userId, updateData, { new: true })
      : await userModel.findByIdAndUpdate(userId, updateData, { new: true });

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

router.post('/update-recruiter-profile', async (req, res) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { companyName, companyField, hrPhone } = req.body;
    const updatedRecruiter = await Recruiter.findByIdAndUpdate(
      userId,
      { companyName, companyField, hrPhone },
      { new: true }
    );

    res.json({ message: 'Recruiter profile updated successfully', user: updatedRecruiter });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating recruiter profile' });
  }
});

// Job Posting
router.get('/job_post', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/user/login');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const recruiter = await Recruiter.findById(decoded.userId);
    res.render('job_post', { user: recruiter });
  } catch (err) {
    console.error(err);
    res.redirect('/user/login');
  }
});

router.post('/post-job', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/user/job_post?success=false');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const recruiter = await Recruiter.findById(decoded.userId);

    if (!recruiter) {
      console.error('Recruiter not found for userId:', decoded.userId);
      return res.redirect('/user/job_post?success=false');
    }

    const {
      jobTitle,
      company,
      location,
      industry,
      jobType,
      salaryMin,
      salaryMax,
      description,
      requirements,
    } = req.body;

    const job = new Job({
      title: jobTitle,
      company: recruiter.companyName || company, // fallback
      location,
      industry,
      jobType,
      salaryMin,
      salaryMax,
      description,
      requirements,
      postedBy: recruiter._id,
    });

    await job.save();

    console.log('✅ Job posted successfully');
    return res.redirect('/user/job_post?success=true');
  } catch (err) {
    console.error('❌ Error saving job:', err);
    return res.redirect('/user/job_post?success=false');
  }
});

// Job Listings
// Job Listings
// GET route to show jobs to apply
// Replace your existing /applyjobs GET route with this:
router.get('/applyjobs', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.redirect('/user/login');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Get all jobs
    const jobs = await Job.find().sort({ createdAt: -1 });
    
    // Get user data
    const user = await userModel.findById(userId);
    
    let jobsWithScores = jobs;

    // If user has skills, calculate match scores
    if (user && user.skills && user.skills.length > 0) {
      try {
        const userSkills = user.skills.join(', ');
        const jobSkillsList = jobs.map(job => job.requirements || '');

        console.log("📤 Calculating match scores for applyjobs page");
        console.log("User skills:", userSkills);
        console.log("Jobs count:", jobs.length);

        const response = await axios.post('http://localhost:5001/match', {
          userSkills,
          jobSkillsList
        }, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });

        const scores = response.data.matchScores;
        console.log("📥 Match scores received:", scores);

        // Add match scores to jobs
        jobsWithScores = jobs.map((job, idx) => {
          const jobObj = job.toObject();
          jobObj.matchScore = scores[idx] || 0;
          return jobObj;
        });

        // Sort by match score (highest first)
        jobsWithScores.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      } catch (matchError) {
        console.error('❌ Match calculation failed:', matchError.message);
        // Continue with jobs without match scores
        jobsWithScores = jobs.map(job => {
          const jobObj = job.toObject();
          jobObj.matchScore = null; // No match score available
          return jobObj;
        });
      }
    } else {
      // User has no skills, show all jobs without match scores
      console.log("ℹ️ User has no skills, showing all jobs without match scores");
      jobsWithScores = jobs.map(job => {
        const jobObj = job.toObject();
        jobObj.matchScore = null;
        return jobObj;
      });
    }

    res.render('applyjobs', { 
      jobs: jobsWithScores, 
      userId: userId,
      hasSkills: user && user.skills && user.skills.length > 0
    });

  } catch (err) {
    console.error('Error loading jobs:', err);
    res.status(500).send('Error loading jobs');
  }
});

// Remove or simplify the /get-matching-data route since we're doing matching in /applyjobs
router.get('/get-matching-data', async (req, res) => {
  // This can be simplified or removed since matching is now done in /applyjobs
  res.json({ message: 'Matching is now handled directly in /applyjobs route' });
});

// POST: Apply for a job
router.post('/apply', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const { jobId } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Check if already applied
    const alreadyApplied = await AppliedJob.findOne({
      user: userId,
      jobId: job._id
    });

    if (alreadyApplied) {
      return res.status(409).json({ message: 'You have already applied for this job' });
    }

    // Create new application
    const newApplication = new AppliedJob({
      user: userId,
      jobId: job._id, // ✅ This was missing before
      title: job.title,
      company: job.company,
      location: job.location,
      category: job.industry,
      type: job.jobType,
      description: job.description,
      salary: `${job.salaryMin}-${job.salaryMax}`,
      requirements: job.requirements
    });

    await newApplication.save();
    res.status(200).json({ message: 'Application submitted successfully' });
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
router.get('/applied_job', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).send('Unauthorized');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const appliedJobs = await AppliedJob.find({ user: userId }).sort({ createdAt: -1 });

    res.render('applied_jobs', { appliedJobs }); // ✅ points to your actual EJS file name
  } catch (err) {
    console.error('Error fetching applied jobs:', err);
    res.status(500).send('Internal Server Error');
  }
});


// View Applicants
const axios = require('axios');
//const Job = require('../models/Job'); // Import your Job model if not already

router.get('/view-applicants/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;

    // Fetch the job to get requirements
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).send('Job not found');
    }
    const jobRequirements = job.requirements || '';

    // Fetch applicants and populate user info + skills
    const applicants = await AppliedJob.find({ jobId })
      .populate('user', 'username email firstName lastName phoneNo skills');

    // Prepare array to hold match percentages
    const matchScores = [];

    // Loop through applicants and call Flask API for each
    for (const applicant of applicants) {
      // Join user skills into a string (comma separated)
      const userSkillsStr = (applicant.user.skills || []).join(', ');

      try {
        // Call Flask API
        const response = await axios.post('http://localhost:5001/match', {
          userSkills: userSkillsStr,
          jobSkillsList: [jobRequirements]
        });

        // Get first (only) score from response array
        const score = response.data.matchScores[0] || 0;

        // Convert to percentage (0-100) rounded
        matchScores.push(Math.round(score * 100));
      } catch (apiErr) {
        console.error('Error calling matching API:', apiErr.message);
        matchScores.push(0); // Default to 0 on error
      }
    }

    // Attach matchPercentage to applicants and convert Mongoose docs to plain objects
    const applicantsWithMatch = applicants.map((applicant, i) => {
      const obj = applicant.toObject();
      obj.matchPercentage = matchScores[i] || 0;
      return obj;
    });

    // Sort descending by matchPercentage
    applicantsWithMatch.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // Render view with applicants data
    res.render('view_candidates', { applicants: applicantsWithMatch });

  } catch (err) {
    console.error('Error fetching applicants:', err);
    res.status(500).send('Internal Server Error');
  }
});




router.post("/saveskills", async (req, res) => {
    const { userId, skills } = req.body;

    try {
        const user = await userModel.findByIdAndUpdate(
            userId,
            { $set: { skills: skills } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Skills updated successfully", user });
    } catch (error) {
        console.error("Error saving skills:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Example route in Express backend


router.get('/get-matching-data', async (req, res) => {
  const userId = req.query.userId;
  console.log("🔍 userId received:", userId);

  if (!userId) {
    console.error("❌ No userId provided");
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await userModel.findById(userId);
    const jobs = await Job.find();

    if (!user) {
      console.error("❌ User not found");
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.skills || user.skills.length === 0) {
      console.error("❌ User has no skills");
      return res.status(400).json({ error: 'User has no skills. Please upload resume first.' });
    }

    const userSkills = user.skills.join(', ');
    const jobSkillsList = jobs.map(job => job.requirements || '');

    console.log("📤 Sending to ML API:", { userSkills, jobSkillsList });

    // Make sure Flask API is running on the correct URL
    const response = await axios.post('http://localhost:5001/match', {
      userSkills,
      jobSkillsList
    }, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const scores = response.data.matchScores;
    console.log("📥 Scores received:", scores);

    // Filter jobs with score > 0.1 and sort by score
    const matchedJobs = jobs
      .map((job, idx) => ({
        ...job.toObject(),
        matchScore: scores[idx] || 0
      }))
      .filter(job => job.matchScore > 0.1)
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({ matchedJobs });

  } catch (err) {
    console.error('💥 Matching failed:', err.message);
    if (err.code === 'ECONNREFUSED') {
      return res.status(500).json({ 
        error: 'ML service unavailable. Please make sure Flask API is running on port 5001.',
        details: err.message 
      });
    }
    res.status(500).json({ error: 'Cannot match jobs', details: err.message });
  }
});

module.exports = router;