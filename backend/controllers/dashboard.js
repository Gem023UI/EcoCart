const db = require('../config/database');

exports.getOverview = (req, res) => {
  // Existing queries
  const totalUsersQuery = `SELECT COUNT(*) AS total FROM users WHERE RoleID = 2 AND StatusID = 1`;
  const totalProductsQuery = `SELECT COUNT(*) AS total FROM product`;
  const completedOrdersQuery = `SELECT COUNT(*) AS total FROM orderhistory WHERE status = 'delivered'`;

  // New additional queries
  const totalRevenueQuery = `
    SELECT COALESCE(SUM(oi.SubTotal), 0) AS total 
    FROM orderitem oi 
    JOIN orderhistory oh ON oi.OrderLineID = oh.OrderLineID 
    WHERE oh.status = 'delivered'
  `;

  const pendingOrdersQuery = `SELECT COUNT(*) AS total FROM orderhistory WHERE status = 'pending'`;

  const lowStockProductsQuery = `SELECT COUNT(*) AS total FROM product WHERE Stocks <= 50`;

  const topSellingProductsQuery = `
    SELECT p.Name AS product_name, SUM(oi.Quantity) AS total_sold 
    FROM orderitem oi 
    JOIN product p ON oi.ProductID = p.ProductID 
    JOIN orderhistory oh ON oi.OrderLineID = oh.OrderLineID 
    WHERE oh.status = 'delivered'
    GROUP BY p.ProductID, p.Name 
    ORDER BY total_sold DESC 
    LIMIT 5
  `;

  const recentOrdersQuery = `
    SELECT ol.Name, oh.Date, oh.status, 
           (SELECT SUM(oi.SubTotal) FROM orderitem oi WHERE oi.OrderLineID = oh.OrderLineID) AS total_amount
    FROM orderhistory oh 
    JOIN orderline ol ON oh.OrderLineID = ol.OrderLineID 
    ORDER BY oh.Date DESC 
    LIMIT 10
  `;

  const orderStatusDistributionQuery = `
    SELECT status, COUNT(*) AS count 
    FROM orderhistory 
    GROUP BY status
  `;

  const monthlyRevenueQuery = `
    SELECT 
      MONTH(oh.Date) AS month, 
      YEAR(oh.Date) AS year,
      SUM(oi.SubTotal) AS revenue 
    FROM orderitem oi 
    JOIN orderhistory oh ON oi.OrderLineID = oh.OrderLineID 
    WHERE oh.status = 'delivered' AND oh.Date IS NOT NULL
    GROUP BY YEAR(oh.Date), MONTH(oh.Date) 
    ORDER BY year DESC, month DESC 
    LIMIT 12
  `;

  const usersByAddressQuery = `
    SELECT 
      COALESCE(Address, 'No Address') AS address, 
      COUNT(*) AS count 
    FROM users 
    WHERE RoleID = 2 AND StatusID = 1
    GROUP BY Address
    ORDER BY count DESC
    LIMIT 10
  `;

  const productsByCategoryQuery = `
    SELECT c.Category AS category, COUNT(p.ProductID) AS count 
    FROM product p 
    JOIN category c ON p.ProdCategoryID = c.ProdCategoryID 
    GROUP BY c.Category
    ORDER BY count DESC
  `;

  const ordersOverTimeQuery = `
    SELECT 
      DATE(Date) AS date, 
      COUNT(*) AS count 
    FROM orderhistory 
    WHERE status = 'delivered' AND Date IS NOT NULL
    GROUP BY DATE(Date)
    ORDER BY DATE(Date) DESC
    LIMIT 30
  `;

  // Execute all queries in sequence
  const queries = [
    { name: 'totalUsers', query: totalUsersQuery },
    { name: 'totalProducts', query: totalProductsQuery },
    { name: 'completedOrders', query: completedOrdersQuery },
    { name: 'totalRevenue', query: totalRevenueQuery },
    { name: 'pendingOrders', query: pendingOrdersQuery },
    { name: 'lowStockProducts', query: lowStockProductsQuery },
    { name: 'topSellingProducts', query: topSellingProductsQuery },
    { name: 'recentOrders', query: recentOrdersQuery },
    { name: 'orderStatusDistribution', query: orderStatusDistributionQuery },
    { name: 'monthlyRevenue', query: monthlyRevenueQuery },
    { name: 'usersByAddress', query: usersByAddressQuery },
    { name: 'productsByCategory', query: productsByCategoryQuery },
    { name: 'ordersOverTime', query: ordersOverTimeQuery }
  ];

  const results = {};

  // Function to execute queries sequentially
  const executeQueries = (index = 0) => {
    if (index >= queries.length) {
      // All queries completed, send response
      const response = {
        // Basic counts
        totalUsers: results.totalUsers?.[0]?.total || 0,
        totalProducts: results.totalProducts?.[0]?.total || 0,
        completedOrders: results.completedOrders?.[0]?.total || 0,
        
        // New metrics
        totalRevenue: results.totalRevenue?.[0]?.total || 0,
        pendingOrders: results.pendingOrders?.[0]?.total || 0,
        lowStockProducts: results.lowStockProducts?.[0]?.total || 0,
        
        // Chart data
        usersByAddress: results.usersByAddress || [],
        productsByCategory: results.productsByCategory || [],
        ordersOverTime: results.ordersOverTime || [],
        topSellingProducts: results.topSellingProducts || [],
        recentOrders: results.recentOrders || [],
        orderStatusDistribution: results.orderStatusDistribution || [],
        monthlyRevenue: results.monthlyRevenue || []
      };

      console.log('Enhanced dashboard data:', response);
      return res.json(response);
    }

    const currentQuery = queries[index];
    db.query(currentQuery.query, (err, result) => {
      if (err) {
        console.error(`${currentQuery.name} query error:`, err);
        results[currentQuery.name] = [];
      } else {
        results[currentQuery.name] = result;
      }
      executeQueries(index + 1);
    });
  };

  executeQueries();
};