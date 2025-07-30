const jwt = require('jsonwebtoken');
const connection = require('../config/database');
const bcrypt = require('bcrypt')

// DONE REGISTER USER FUNCTION
const registerUser = async (req, res) => {
  const { firstname, lastname, password, email } = req.body;
  
  // Validate required fields
  if (!firstname || !lastname || !password || !email) {
    return res.status(400).json({ error: "First Name, Last Name, Password, and Email are required." });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // SQL query with address and phone number set to null
    const userSql = `
      INSERT INTO users (RoleID, FirstName, LastName, Address, Email, PhoneNumber, Password, StatusID)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Execute the query
    connection.execute(
      userSql,
      [
        2, // RoleID for Customer
        firstname, 
        lastname, 
        null, // Address set to null
        email, 
        null, // PhoneNumber set to null
        hashedPassword, 
        1 // StatusID for Active
      ],
      (err, result) => {
        if (err) {
          console.error("SQL Error:", err);
          
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ 
              error: 'Email already exists. Please use a different email address.' 
            });
          }
          
          // Return more detailed error information
          return res.status(500).json({ 
            error: "Database error occurred during registration.",
            details: err.message || err.sqlMessage || "Unknown error"
          });
        }
        
        // Success response
        return res.status(201).json({ 
          success: true, 
          message: "User registered successfully",
          userId: result.insertId 
        });
      }
    );
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ 
      error: "An error occurred during registration.",
      details: error.message 
    });
  }
};

// DONE LOGIN W/ JSON WEB TOKEN FUNCTION
const loginUser = (req, res) => {
  const { email, password } = req.body;
  const sql = 'SELECT UserID, FirstName, LastName, Email, Password, RoleID, StatusID FROM users WHERE Email = ?';
  connection.execute(sql, [email], async (err, results) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Error logging in', details: err });
    }
    if (results.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = results[0];

    const match = await bcrypt.compare(password, user.Password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Remove password from response
    delete user.Password;

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.UserID,
        email: user.Email,
        roleId: user.RoleID
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '2h' }
    );

    // Insert token into users table (sessionToken column)
    const updateTokenSql = 'UPDATE users SET sessionToken = ? WHERE UserID = ?';
    connection.execute(updateTokenSql, [token, user.UserID], (updateErr) => {
      if (updateErr) {
        console.error('Error updating sessionToken:', updateErr);
        // Continue anyway, but you may want to handle this differently
      }

      // Respond with token and user info, and indicate which key to use in sessionStorage
      let tokenKey = user.RoleID === 1 ? 'adminToken' : 'userToken'; // 1 = Admin, 2 = Customer

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        tokenKey, // Tell frontend which key to use
        user: {
          userId: user.UserID,
          firstname: user.FirstName,
          lastname: user.LastName,
          email: user.Email,
          roleId: user.RoleID,
          statusId: user.StatusID
        }
      });
    });
  });
};

const updateUser = (req, res) => {
  // {
  //   "name": "steve",
  //   "email": "steve@gmail.com",
  //   "password": "password"
  // }
  console.log(req.body, req.file)
  const { title, fname, lname, addressline, town, zipcode, phone, userId,} = req.body;

  if (req.file) {
    image = req.file.path.replace(/\\/g, "/");
  }
  //     INSERT INTO users(user_id, username, email)
  //   VALUES(1, 'john_doe', 'john@example.com')
  // ON DUPLICATE KEY UPDATE email = 'john@example.com';
  const userSql = `
  INSERT INTO customer 
    (title, fname, lname, addressline, town, zipcode, phone, image_path, user_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    fname = VALUES(fname),
    lname = VALUES(lname),
    addressline = VALUES(addressline),
    town = VALUES(town),
    zipcode = VALUES(zipcode),
    phone = VALUES(phone),
    image_path = VALUES(image_path)`;
    const params = [title, fname, lname, addressline, town, zipcode, phone, image, userId];

  try {
    connection.execute(userSql, params, (err, result) => {
      if (err instanceof Error) {
        console.log(err);

        return res.status(401).json({
          error: err
        });
      }

      return res.status(200).json({
        success: true,
        message: 'profile updated',
        result
      })
    });
  } catch (error) {
    console.log(error)
  }

};

const deactivateUser = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const sql = 'UPDATE users SET deleted_at = ? WHERE email = ?';
  const timestamp = new Date();

  connection.execute(sql, [timestamp, email], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: 'Error deactivating user', details: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      email,
      deleted_at: timestamp
    });
  });
};

module.exports = { registerUser, loginUser, updateUser, deactivateUser };