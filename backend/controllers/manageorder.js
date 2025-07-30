const connection = require('../config/database');
const path = require('path');
const fs = require('fs');

exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT 
        ol.OrderLineID as id,
        ol.Name as customer_name,
        ol.Address as shipping_address,
        ol.PhoneNumber,
        oh.status,
        oh.UserID as user_id,
        oi.OrderItemID,
        oi.ProductID as product_id,
        oi.Quantity,
        oi.SubTotal as item_price,
        p.Name as product_name,
        p.Price as product_price
      FROM orderline ol
      LEFT JOIN orderitem oi ON ol.OrderLineID = oi.OrderLineID
      LEFT JOIN product p ON oi.ProductID = p.ProductID
      LEFT JOIN orderhistory oh ON ol.OrderLineID = oh.OrderLineID
      ORDER BY ol.OrderLineID DESC
    `);

    // Group items by order
    const groupedOrders = {};
    orders.forEach(row => {
      if (!groupedOrders[row.id]) {
        groupedOrders[row.id] = {
          id: row.id,
          user: {
            id: row.user_id,
            name: row.customer_name,
            phone: row.PhoneNumber
          },
          total: 0,
          status: row.status || 'pending',
          created_at: '', // Not available, can be added if you have a column
          shipping_address: row.shipping_address,
          items: []
        };
      }
      if (row.product_id) {
        groupedOrders[row.id].items.push({
          product_id: row.product_id,
          product_name: row.product_name,
          product_price: row.product_price,
          quantity: row.Quantity,
          item_price: row.item_price
        });
        groupedOrders[row.id].total += parseFloat(row.item_price || 0);
      }
    });

    res.json(Object.values(groupedOrders));
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    const [orderRows] = await db.query(`
      SELECT 
        o.id, o.user_id, o.total, o.status, o.created_at, o.shipping_address, o.subtotal, o.shipping_fee,
        u.name as user_name, u.email as user_email,
        oi.product_id, oi.quantity, oi.price as item_price,
        p.name as product_name, p.price as product_price, p.image as product_image
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = ?
      ORDER BY oi.id
    `, [orderId]);
    
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = {
      id: orderRows[0].id,
      user_id: orderRows[0].user_id,
      total: orderRows[0].total,
      subtotal: orderRows[0].subtotal,
      shipping_fee: orderRows[0].shipping_fee,
      status: orderRows[0].status,
      created_at: orderRows[0].created_at,
      shipping_address: orderRows[0].shipping_address,
      User: {
        id: orderRows[0].user_id,
        name: orderRows[0].user_name,
        email: orderRows[0].user_email
      },
      Products: orderRows.filter(row => row.product_id).map(row => ({
        id: row.product_id,
        name: row.product_name,
        price: row.product_price,
        image: row.product_image,
        OrderItem: {
          quantity: row.quantity,
          price: row.item_price
        }
      }))
    };
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, orderId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    
    await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    const [result] = await db.query('DELETE FROM orders WHERE id = ?', [orderId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: error.message });
  }
};