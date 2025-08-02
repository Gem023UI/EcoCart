const db = require('../config/database');

exports.getOrderHistoryByUser = (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT 
      oh.OrderHistoryID AS id,
      oh.status,
      oi.ProductID AS product_id,
      oi.Quantity AS quantity,
      oi.SubTotal AS total,
      p.Name AS product_name,
      ol.Name AS customer_name,
      ol.Address,
      ol.PhoneNumber,
      oh.Date,
      ol.ZipCode
    FROM orderhistory oh
    JOIN orderline ol ON oh.OrderLineID = ol.OrderLineID
    JOIN orderitem oi ON ol.OrderLineID = oi.OrderLineID
    JOIN product p ON oi.ProductID = p.ProductID
    WHERE oh.UserID = ?
    ORDER BY oh.OrderHistoryID DESC
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching order history:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
};
