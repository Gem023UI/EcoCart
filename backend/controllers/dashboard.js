const jwt = require('jsonwebtoken');
const connection = require('../config/database');
const bcrypt = require('bcrypt');

// DONE GET ALL USERS
const getAllUsers = (req, res) => {
    console.log('Getting all users...'); // Debug log
    
    const sql = 'SELECT UserID, FirstName, LastName, Address, Email, PhoneNumber, RoleID, StatusID FROM users WHERE DeleteDate IS NULL';
    
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('Database error in getAllUsers:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        console.log(`Found ${results.length} users`); // Debug log
        res.json(results);
    });
};

// DONE GET USER BY ID
const getUserById = (req, res) => {
    const { id } = req.params;
    console.log(`Getting user with ID: ${id}`); // Debug log
    
    const sql = 'SELECT UserID, FirstName, LastName, Address, Email, PhoneNumber, RoleID, StatusID FROM users WHERE UserID = ? AND DeleteDate IS NULL';
    
    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Database error in getUserById:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(results[0]);
    });
};

// DONE UPDATE USER BY ID
const updateUserById = (req, res) => {
    const { id } = req.params;
    const { firstname, lastname, address, email, phone, roleId, statusId } = req.body;
    
    console.log(`Updating user ${id} with data:`, req.body); // Debug log
    
    const sql = 'UPDATE users SET FirstName = ?, LastName = ?, Address = ?, Email = ?, PhoneNumber = ?, RoleID = ?, StatusID = ? WHERE UserID = ?';
    
    connection.query(sql, [firstname, lastname, address, email, phone, roleId, statusId, id], (err, result) => {
        if (err) {
            console.error('Database error in updateUserById:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, message: 'User updated successfully' });
    });
};

// DONE SOFT DELETE USER BY ID
const deleteUserById = (req, res) => {
    const { id } = req.params;
    console.log(`Soft deleting user with ID: ${id}`); // Debug log
    
    const sql = 'UPDATE users SET DeleteDate = NOW() WHERE UserID = ?';
    
    connection.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Database error in deleteUserById:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, message: 'User deleted successfully' });
    });
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUserById,
    deleteUserById
};