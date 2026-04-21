const jwt = require('jsonwebtoken');
require('dotenv').config();
const { invalidTokens } = require('../controller/storeTokenInvalid');

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    
    if (!token) return res.status(401).json({ 
        message: 'Access denied!',
        status : 'failed',
        status_code : '401'
    });
    
    if (invalidTokens.includes(token)) {
        return res.status(403).send({ message: 'Token has been invalidated' });
    }


    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Session expired. Please login again.',
                status : 'failed',
                status_code : '401'
             });
        }
        res.status(400).json({ 
            message: 'Invalid token!' ,
            status: 'failed',
            status_code : '400'
        });
    }
};

module.exports = authenticateToken;
