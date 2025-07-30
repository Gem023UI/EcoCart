const db = require('../config/database');
const jwt = require('jsonwebtoken');

// Middleware to check if user is logged in, active, and an admin
async function verifyAdmin(req, res, next) {
  try {
    // Check for token in Authorization header (Bearer <token>)
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get userId from decoded token
    const userId = decoded.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Query user info, role, and status
    const [rows] = await db.query(`
      SELECT u.UserID, u.StatusID, u.RoleID, r.Category AS role, s.Category AS status
      FROM users u
      LEFT JOIN role r ON u.RoleID = r.RoleID
      LEFT JOIN status s ON u.StatusID = s.StatusID
      WHERE u.UserID = ?
      LIMIT 1
    `, [userId]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = rows[0];

    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'User account is not active' });
    }

    if (user.role !== 'Admin') {
      return res.status(403).json({ error: 'User is not an admin' });
    }

    // Attach user info to request for downstream use
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

module.exports = { verifyAdmin };