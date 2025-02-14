const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.render('register', { error: 'All fields are required' });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('register', { error: 'Email is already registered' });
        }
        const user = new User({ name, email, password });
        await user.save();
        res.redirect('/auth/login');
    } catch (err) {
        res.render('register', { error: 'An error occurred. Please try again.' });
    }
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.render('login', { error: 'All fields are required' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', { error: 'Invalid credentials' });
        }
        if (user.isLocked) {
            return res.render('login', { error: 'Account is locked due to multiple failed attempts' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 5) {
                user.isLocked = true;
            }
            await user.save();
            return res.render('login', { error: 'Invalid credentials' });
        }
        user.failedLoginAttempts = 0;
        user.isLocked = false;
        await user.save();

        req.session.user = user;
        res.redirect('/dashboard');
    } catch (err) {
        res.render('login', { error: 'An error occurred. Please try again.' });
    }
});

module.exports = router;
