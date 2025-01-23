const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Route: Register a new user
router.post('/register', async (req, res) => {
    const { name, email, password, role, uni_id, courses_enrolled } = req.body;

    try {
        const userExists = await User.findOne({ uni_id });
        if (userExists) {
            return res.status(400).json({ message: 'Id already exists' });
        }

        const newUser = new User({ name, email, password, role, uni_id, courses_enrolled });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// Route: Login a user
router.post('/login', async (req, res) => {
    const { uni_id, password } = req.body;

    try {
        const user = await User.findOne({ uni_id });
        if (user && user.password === password) {
            res.status(200).json({
                message: 'Login successful',
                user: {
                    id: user._id,
                    uni_id:user.uni_id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

module.exports = router;
