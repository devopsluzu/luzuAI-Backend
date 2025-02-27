const { auth } = require('../utils/firebaseAdmin');

const verifySession = async (req, res, next) => {
    const sessionCookie = req.cookies.session || '';
    try {
        const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
        req.user = decodedClaims;
        next();
    } catch (error) {
        console.error('Session verification failed:', error);
        res.status(401).send('Unauthorized');
    }
};

module.exports = verifySession;
