const db = require('../config/database');
const jwt = require('jsonwebtoken');

function verifyAdmin(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const userId = decoded.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Use callback style for db query
    db.query(`
      SELECT u.UserID, u.StatusID, u.RoleID, r.Category AS role, s.Category AS status
      FROM users u
      LEFT JOIN role r ON u.RoleID = r.RoleID
      LEFT JOIN status s ON u.StatusID = s.StatusID
      WHERE u.UserID = ?
      LIMIT 1
    `, [userId], (err, rows) => {
      if (err) {
        console.error('Auth middleware error:', err);
        return res.status(500).json({ error: 'Authentication failed' });
      }
      if (!rows || rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }
      const user = rows[0];
      if (user.status !== 'Active') {
        return res.status(403).json({ error: 'User account is not active' });
      }
      if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'User is not an admin' });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

function verifyCustomer(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const userId = decoded.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Invalid token payload' });
  }

  db.query(`
    SELECT u.UserID, u.StatusID, u.RoleID, r.Category AS role, s.Category AS status
    FROM users u
    LEFT JOIN role r ON u.RoleID = r.RoleID
    LEFT JOIN status s ON u.StatusID = s.StatusID
    WHERE u.UserID = ?
    LIMIT 1
  `, [userId], (err, rows) => {
    if (err) {
      console.error('Auth middleware error:', err);
      return res.status(500).json({ error: 'Authentication failed' });
    }
    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    const user = rows[0];
    if (user.status !== 'Active') {
      return res.status(403).json({ error: 'User account is not active' });
    }
    req.user = user;
    next();
  });
}

module.exports = { verifyAdmin, verifyCustomer };