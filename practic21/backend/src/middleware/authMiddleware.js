const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.ACCESS_SECRET);
        const userRepo = new UserRepository();
        const userFromDB = await userRepo.findById(payload.sub);

        if (!userFromDB) {
            return res.status(401).json({ error: "User not found. Please login again." });
        }

        if (userFromDB.is_blocked) {
            return res.status(403).json({ error: "User is blocked." });
        }

        // Проверка смены роли
        if (userFromDB.role !== payload.role) {
            return res.status(401).json({ 
                error: "Your role has been changed. Please login again.",
                forceLogout: true 
            });
        }

        req.user = { 
            sub: userFromDB.id,
            email: userFromDB.email,
            first_name: userFromDB.first_name,
            last_name: userFromDB.last_name,
            role: userFromDB.role 
        };

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: "Access token expired" });
        }
        return res.status(401).json({ error: "Invalid token" });
    }
}

module.exports = authMiddleware;