require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 5000;

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://trafy-websiteclone-865611889264.us-central1.run.app',
    'https://trafy-blogclone-865611889264.us-central1.run.app',
    'https://trafy.ai',
    'https://blog.trafy.ai',
    'https://trafy-newbackend-255821839155.us-central1.run.app',
    'https://prfec.ai',
    'https://app.prfec.ai',
    
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.sendStatus(204);
    } else {
        next();
    }
});

app.use(cookieParser());
app.use(express.json());

// Routes
app.use('/api', require('./routes/paymentRoute'));


// Middleware to verify session cookies
app.use(async (req, res, next) => {
    const sessionCookie = req.cookies.session || '';
    try {
        const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
        req.user = decodedClaims;
        next();
    } catch (error) {
        res.status(401).send('Unauthorized');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
