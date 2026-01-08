const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Basic Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Indicadores API' });
});

// Import Routes
const authRoutes = require('./routes/auth.routes');
const secretariasRoutes = require('./routes/secretarias');
// const userRoutes = require('./routes/user.routes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/secretarias', secretariasRoutes);
// app.use('/api/users', userRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: true,
        message: err.message || 'Internal Server Error'
    });
});

// Start Server
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

module.exports = app;
