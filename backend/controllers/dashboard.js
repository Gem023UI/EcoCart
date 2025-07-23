const db = require('../config/database');

exports.getOverview = (req, res) => {
  const totalUsersQuery = `SELECT COUNT(*) AS total FROM users WHERE RoleID = 2`;
  const totalProductsQuery = `SELECT COUNT(*) AS total FROM product`;
  const completedOrdersQuery = `SELECT COUNT(*) AS total FROM orders WHERE Status = 'Completed'`;

  const usersByAddressQuery = `
    SELECT Address, COUNT(*) AS count 
    FROM users 
    WHERE RoleID = 2 AND Address IS NOT NULL 
    GROUP BY Address
  `;

  const productsByCategoryQuery = `
    SELECT c.Category, COUNT(p.ProductID) AS count 
    FROM product p 
    JOIN category c ON p.ProdCategoryID = c.ProdCategoryID 
    GROUP BY c.Category
  `;

  const ordersOverTimeQuery = `
    SELECT DATE(DatePlaced) AS date, COUNT(*) AS count 
    FROM orders 
    WHERE Status = 'Completed'
    GROUP BY DATE(DatePlaced)
    ORDER BY DATE(DatePlaced)
  `;

  db.query(totalUsersQuery, (err, userResult) => {
    if (err) return res.status(500).json({ error: err });

    db.query(totalProductsQuery, (err, productResult) => {
      if (err) return res.status(500).json({ error: err });

      db.query(completedOrdersQuery, (err, orderResult) => {
        if (err) return res.status(500).json({ error: err });

        db.query(usersByAddressQuery, (err, userAddrResult) => {
          if (err) return res.status(500).json({ error: err });

          db.query(productsByCategoryQuery, (err, productCatResult) => {
            if (err) return res.status(500).json({ error: err });

            db.query(ordersOverTimeQuery, (err, orderTimeResult) => {
              if (err) return res.status(500).json({ error: err });

              return res.json({
                totalUsers: userResult[0].total,
                totalProducts: productResult[0].total,
                completedOrders: orderResult[0].total,
                usersByAddress: userAddrResult,
                productsByCategory: productCatResult,
                ordersOverTime: orderTimeResult
              });
            });
          });
        });
      });
    });
  });
};
