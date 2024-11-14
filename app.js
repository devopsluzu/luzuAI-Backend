require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');  // To parse cookies
const app = express();
var http = require('http').Server(app);

const paymentRoute = require('./routes/paymentRoute');
const paymentController=require('./controllers/paymentController');

// Firebase Admin
const admin = require('./firebaseAdmin');
const PORT = 6000;

// const corsOptions = {
//     origin: function (origin, callback) {
//         const allowedOrigins = [
//             'http://localhost:3000',
//             'http://localhost:3001',
//             'https://trafy.ai',
//             'https://blog.trafy.ai'
//         ];

        
//         if (!origin || allowedOrigins.indexOf(origin) !== -1) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
//     credentials: true,
//     maxAge: 86400 // 24 hours
// };

app.use(cors({
    origin: ['http://localhost:3000','http://localhost:3001',
            ,'https://trafy.ai','https://blog.trafy.ai/'], // Allow both local and GCP origins
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type,Authorization',
}));

app.use(cookieParser());  // Parse cookies
app.use(express.json());  // To parse JSON bodies
app.use('/api', paymentRoute);


// Middleware to verify session cookies
app.use(async (req, res, next) => {
    const sessionCookie = req.cookies.session || ''; // Get session cookie
    try {
        const decodedClaims = await admin.auth().verifySessionCookie(sessionCookie, true);
        req.user = decodedClaims;  // Attach user information to request
        next();
    } catch (error) {
        res.status(401).send('Unauthorized');
    }
});

app.listen(PORT, ()=>{
    console.log(`Server is running on port ${PORT}`);
});
