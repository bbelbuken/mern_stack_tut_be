const allowedOrigins = require('./allowedOrigins');

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true); // * 1st argument error object 2nd is allowed bool
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // ! ACCESS_CONTROL_ALLOW_CREDENTIALS header true
    optionsSuccessStatus: 200,
};

module.exports = corsOptions;
