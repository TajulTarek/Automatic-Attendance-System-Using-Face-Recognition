const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require("body-parser");
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');

const teacherRoutes = require('./routes/teacherRoutes');



``
const modelRoutes = require('./routes/modelRoutes');

const cors = require('cors');





dotenv.config(); 

const app = express();



app.use(bodyParser.json({ limit: "50mb" })); // Allow large image uploads
app.use(express.static("uploads")); // Serve images from the uploads folder


// Use CORS middleware
app.use(cors({
    origin: '*', // Allow requests from any origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    credentials: false // Set to true only if you need cookies or authentication headers
}));


app.use(express.json());

// Routes
app.use('/reports', express.static(path.join(__dirname, 'reports')));

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
