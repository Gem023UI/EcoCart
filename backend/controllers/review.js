const db = require('../config/database');

// Create a review (date will be auto-inserted)
exports.createReview = (req, res) => {
  const { orderId, productId, userId, description, rating } = req.body;
  
  // Debug logging
  console.log('Received review data:', req.body);
  console.log('Parsed values:', { orderId, productId, userId, description, rating });
  
  if (!orderId || !productId || !userId || !description || !rating) {
    console.log('Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate that productId exists in the product table first
  const checkProductSql = 'SELECT ProductID FROM product WHERE ProductID = ?';
  db.query(checkProductSql, [productId], (err, productResults) => {
    if (err) {
      console.error('Error checking product existence:', err);
      return res.status(500).json({ error: 'Database error checking product' });
    }

    if (productResults.length === 0) {
      console.log(`Product with ID ${productId} does not exist`);
      return res.status(400).json({ error: 'Product does not exist' });
    }

    // Validate that orderId exists in the orderhistory table
    const checkOrderSql = 'SELECT OrderHistoryID FROM orderhistory WHERE OrderHistoryID = ?';
    db.query(checkOrderSql, [orderId], (err, orderResults) => {
      if (err) {
        console.error('Error checking order existence:', err);
        return res.status(500).json({ error: 'Database error checking order' });
      }

      if (orderResults.length === 0) {
        console.log(`Order with ID ${orderId} does not exist`);
        return res.status(400).json({ error: 'Order does not exist' });
      }

      // Now insert the review
      const sql = `INSERT INTO review (OrderHistoryID, ProductID, UserID, Description, Rating) VALUES (?, ?, ?, ?, ?)`;
      console.log('Executing SQL:', sql);
      console.log('With values:', [orderId, productId, userId, description, rating]);
      
      db.query(sql, [orderId, productId, userId, description, rating], (err, result) => {
        if (err) {
          console.error('Error inserting review:', err);
          return res.status(500).json({ error: 'Database error inserting review' });
        }
        console.log('Review inserted successfully:', result);
        res.json({ message: 'Review submitted successfully' });
      });
    });
  });
};

// Get all reviews for a product
exports.getReviewsByProduct = (req, res) => {
  const productId = req.params.productId;
  const sql = `
    SELECT r.*, CONCAT(u.FirstName, ' ', u.LastName) AS user_name
    FROM review r
    JOIN users u ON r.UserID = u.UserID
    WHERE r.ProductID = ?
    ORDER BY r.ReviewDate DESC
  `;
  db.query(sql, [productId], (err, rows) => {
    if (err) {
      console.error('Error fetching reviews:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
};