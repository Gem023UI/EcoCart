const connection = require('../config/database');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

// GET ALL ORDERS
exports.getAllOrders = (req, res) => {
  const sql = `
    SELECT 
      ol.OrderLineID as id,
      ol.Name as customer_name,
      ol.Address as shipping_address,
      ol.PhoneNumber,
      oh.status,
      oh.UserID as user_id,
      oh.Date as order_date,
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
  `;
  connection.query(sql, (err, rows) => {
  if (err) {
    console.error('Error fetching orders:', err);
    return res.status(500).json({ error: err.message });
  }

  // Group rows by OrderLineID
  const groupedOrders = {};

  rows.forEach(row => {
    if (!groupedOrders[row.id]) {
      groupedOrders[row.id] = {
        id: row.id,
        user: { name: row.customer_name },
        shipping_address: row.shipping_address,
        phone: row.PhoneNumber,
        status: row.status,
        user_id: row.user_id,
        date: row.order_date,
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
    }
  });

  res.json(Object.values(groupedOrders));
});

};

// GET ORDER BY ID
exports.getOrderById = (req, res) => {
  const orderLineId = req.params.id;
  const sql = `
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
    WHERE ol.OrderLineID = ?
    ORDER BY oi.OrderItemID
  `;
  connection.query(sql, [orderLineId], (err, rows) => {
    if (err) {
      console.error('Error fetching order:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Build the order object from rows
    const order = {
      id: rows[0].id,
      customer_name: rows[0].customer_name,
      shipping_address: rows[0].shipping_address,
      phone: rows[0].PhoneNumber,
      status: rows[0].status,
      user_id: rows[0].user_id,
      items: rows.filter(r => r.product_id).map(r => ({
        order_item_id: r.OrderItemID,
        product_id: r.product_id,
        product_name: r.product_name,
        product_price: r.product_price,
        quantity: r.Quantity,
        item_price: r.item_price
      }))
    };

    res.json(order);
  });
};

// UPDATE ORDER STATUS
exports.updateOrderStatus = (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  // Update status in orderhistory table
  const sql = 'UPDATE orderhistory SET status = ? WHERE OrderLineID = ?';
  connection.query(sql, [status, orderId], (err, result) => {
    if (err) {
      console.error('Error updating order status:', err);
      return res.status(500).json({ error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fetch order and customer details for email
    const orderSql = `
      SELECT 
        ol.OrderLineID as id,
        ol.Name as customer_name,
        ol.Address as shipping_address,
        ol.PhoneNumber,
        oh.status,
        oh.UserID as user_id,
        oh.Date as order_date,
        oi.OrderItemID,
        oi.ProductID as product_id,
        oi.Quantity,
        oi.SubTotal as item_price,
        p.Name as product_name,
        p.Price as product_price,
        u.email as customer_email
      FROM orderline ol
      LEFT JOIN orderitem oi ON ol.OrderLineID = oi.OrderLineID
      LEFT JOIN product p ON oi.ProductID = p.ProductID
      LEFT JOIN orderhistory oh ON ol.OrderLineID = oh.OrderLineID
      LEFT JOIN users u ON oh.UserID = u.UserID
      WHERE ol.OrderLineID = ?
    `;
    connection.query(orderSql, [orderId], (err, rows) => {
      if (err || !rows || rows.length === 0) {
        console.error('Error fetching order for email:', err);
        // The status is already updated, so just notify about the email failure
        return res.json({ message: 'Order status updated, but failed to send email.' });
      }

      const order = rows[0];
      const customerEmail = order.customer_email;
      if (!customerEmail) {
        return res.json({ message: 'Order status updated, but customer email not found.' });
      }

      // Generate PDF
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument();
      let buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);

        // Send email with PDF attachment
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'shopatecocart@gmail.com',
            pass: 'sglc pbgi kwav heqw'
          }
        });

        const mailOptions = {
          from: 'shopatecocart@gmail.com',
          to: customerEmail,
          subject: `Order #${order.id} Status Updated to ${status}`,
          text: `Dear ${order.customer_name},\n\nYour order status has been updated to "${status}". Please see the attached PDF for details.`,
          attachments: [
            {
              filename: `Order_${order.id}.pdf`,
              content: pdfData
            }
          ]
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
            return res.json({ message: 'Order status updated, but failed to send email.' });
          }
          // Only send success after both DB update and email are done
          res.json({ message: 'Order status updated and email sent successfully.' });
        });
      });

      // PDF Content
      doc.fontSize(18).text(`Order #${order.id} Details`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Customer: ${order.customer_name}`);
      doc.text(`Address: ${order.shipping_address}`);
      doc.text(`Phone: ${order.PhoneNumber}`);
      doc.text(`Order Date: ${order.order_date}`);
      doc.text(`Status: ${status}`);
      doc.moveDown();
      doc.text('Items:', { underline: true });

      rows.forEach(item => {
        if (item.product_id) {
          doc.text(`- ${item.product_name} (x${item.Quantity}) - ₱${item.product_price} each, Subtotal: ₱${item.item_price}`);
        }
      });

      doc.end();
    });
  });
};

// DELETE ORDER
exports.deleteOrder = (req, res) => {
  const orderId = req.params.id;

  // Delete order items first
  connection.query('DELETE FROM orderitem WHERE OrderLineID = ?', [orderId], (err) => {
    if (err) {
      console.error('Error deleting order items:', err);
      return res.status(500).json({ error: err.message });
    }
    // Delete order history
    connection.query('DELETE FROM orderhistory WHERE OrderLineID = ?', [orderId], (err) => {
      if (err) {
        console.error('Error deleting order history:', err);
        return res.status(500).json({ error: err.message });
      }
      // Delete order line
      connection.query('DELETE FROM orderline WHERE OrderLineID = ?', [orderId], (err, result) => {
        if (err) {
          console.error('Error deleting order:', err);
          return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully' });
      });
    });
  });
};