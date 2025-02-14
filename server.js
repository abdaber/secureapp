require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const User = require('./models/User');
const authRoutes = require('./routes/auth');
const bcrypt = require('bcryptjs');

const app = express();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Atlas connected'))
    .catch(err => console.log(err));

// Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));

// Middleware
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));

// Multer Configuration for Profile Picture Uploads
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Routes
app.use('/auth', authRoutes);

// Homepage
app.get('/', (req, res) => {
    res.render('index');
});

// Dashboard - Protected Route
app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('dashboard', { user: req.session.user });
});

// Edit Profile
app.get('/edit-profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('editProfile', { user: req.session.user });
});

app.post('/edit-profile', upload.single('profilePicture'), async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    try {
        const user = await User.findById(req.session.user._id);
        user.name = req.body.name || user.name;
        if (req.file) {
            user.profilePicture = `/uploads/${req.file.filename}`;
        }
        await user.save();

        req.session.user = user;
        res.redirect('/dashboard');
    } catch (err) {
        console.log(err);
        res.redirect('/edit-profile');
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
