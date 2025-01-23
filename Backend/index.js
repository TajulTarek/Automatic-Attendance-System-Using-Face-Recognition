const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const modelRoutes = require('./routes/modelRoutes');

dotenv.config(); 

const app = express();

app.use(express.json());

// Routes
app.use('/users', userRoutes);
app.use('/courses', courseRoutes);
app.use('/teachers', teacherRoutes);
app.use('/models',modelRoutes);

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((error) => console.error('MongoDB connection error:', error));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
