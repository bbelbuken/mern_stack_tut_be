require('dotenv').config();
require('express-async-errors'); // ! YOU DON'T HAVE TO USE ASYNC HANDLER IF YOU USE THIS
const express = require('express');
const app = express();
const path = require('path');
const { logger, logEvents } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const connectDB = require('./config/dbConn');
const mongoose = require('mongoose');
const PORT = process.env.PORT || 3500;

// ? CONNECTION
connectDB();
(async () => {
    const chalk = await import('chalk');
    console.log(chalk.default.cyan.italic(process.env.NODE_ENV));
})();

// ? MIDDLEWARES
app.use(logger);
app.use(cors(corsOptions));
app.use(express.json()); // parse json
app.use(express.urlencoded({ extended: false })); // parse urlencoded
app.use(cookieParser());
app.use('/', express.static(path.join(__dirname, 'public'))); // static file

// ? ROUTES
app.use('/', require('./routes/root'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/notes', require('./routes/notesRoutes'));

app.all('*', (req, res) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'));
    } else if (req.accepts('html')) {
        res.json({ message: '404 Not Found' });
    } else {
        res.type('txt').send('404 Not Found');
    }
});

app.use(errorHandler); // ! last middleware so no next() in errorHandler

// ? LISTENERS
mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
});
mongoose.connection.on('error', (err) => {
    console.log(err);
    logEvents(
        `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
        'mongoErrLog.log'
    );
});
