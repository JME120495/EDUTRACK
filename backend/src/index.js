require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./routes/auth');
const schoolRoutes = require('./routes/schools');
const userRoutes = require('./routes/users');
const classRoutes = require('./routes/classes');
const studentRoutes = require('./routes/eleves');
const subjectRoutes = require('./routes/matieres');
const sequenceRoutes = require('./routes/sequences');
const gradeRoutes = require('./routes/notes');
const timetableRoutes = require('./routes/timetable');
const bulletinRoutes = require('./routes/bulletins');
const absenceRoutes = require('./routes/absences');
const paymentRoutes = require('./routes/paiements');
const creneauRoutes = require('./routes/creneaux');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static files (PDF bulletings folder)
app.use('/bulletins', express.static(path.join(__dirname, '..', 'public', 'bulletins')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/eleves', studentRoutes);
app.use('/api/matieres', subjectRoutes);
app.use('/api/sequences', sequenceRoutes);
app.use('/api/notes', gradeRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/emplois-du-temps', timetableRoutes);
app.use('/api/bulletins', bulletinRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/paiements', paymentRoutes);
app.use('/api/creneaux', creneauRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[EduTrack Backend] Server is running on port ${PORT}`);
});
