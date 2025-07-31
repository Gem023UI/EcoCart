const db = require('../config/database');

exports.createOrder = (req, res) => {
    console.log('=== ORDER REQUEST DEBUG ===');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    
    const { userId, cart, orderDetails } = req.body;
    
    console.log('Extracted values:');
    console.log('- userId:', userId, typeof userId);
    console.log('- cart:', JSON.stringify(cart, null, 2));
    console.log('- orderDetails:', JSON.stringify(orderDetails, null, 2));
    console.log('========================');

    if (!userId || !Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ message: 'Invalid order data' });
    }

    // Extract order details (name, phone, zipcode, address)
    const { name, phoneNumber, zipCode, address } = orderDetails || {};

    if (!name || !phoneNumber || !zipCode || !address) {
        return res.status(400).json({ message: 'Missing required order details (name, phone, zipcode, address)' });
    }

    // Start database transaction
    db.beginTransaction(err => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Transaction error', details: err });
        }

        // Create order line first
        const orderLineSql = 'INSERT INTO orderline (Name, PhoneNumber, ZipCode, Address) VALUES (?, ?, ?, ?)';
        db.execute(orderLineSql, [name, phoneNumber, zipCode, address], (err, orderLineResult) => {
            if (err) {
                return db.rollback(() => {
                    if (!res.headersSent) {
                        console.error('Order Line Insert Error:', err);
                        res.status(500).json({ error: 'Error creating order line', details: err });
                    }
                });
            }

            const orderLineId = orderLineResult.insertId;

            // Insert each cart item into orderitem
            const orderItemSql = 'INSERT INTO orderitem (OrderLineID, ProductID, Quantity, SubTotal) VALUES (?, ?, ?, ?)';
            let errorOccurred = false;
            let completed = 0;

            if (cart.length === 0) {
                return db.rollback(() => {
                    if (!res.headersSent) {
                        res.status(400).json({ error: 'Cart is empty' });
                    }
                });
            }

            cart.forEach((item, idx) => {
                console.log(`=== PROCESSING CART ITEM ${idx} ===`);
                console.log('Raw item:', JSON.stringify(item, null, 2));
                console.log('Item keys:', Object.keys(item));
                console.log('Item values:', Object.values(item));
                
                // Handle different possible property names with detailed logging
                const itemId = item.id || item.productId || item.ProductID || item.item_id || item.product_id;
                const itemQuantity = item.quantity || item.qty;
                const itemPrice = item.price || item.unit_price;
                
                console.log('Extracted values:');
                console.log('- itemId:', itemId, typeof itemId);
                console.log('- itemQuantity:', itemQuantity, typeof itemQuantity);
                console.log('- itemPrice:', itemPrice, typeof itemPrice);
                
                // Convert to proper types and validate
                const finalId = itemId ? parseInt(itemId) : null;
                const finalQuantity = itemQuantity ? parseInt(itemQuantity) : null;
                const finalPrice = itemPrice ? parseFloat(itemPrice) : null;
                
                console.log('Final converted values:');
                console.log('- finalId:', finalId);
                console.log('- finalQuantity:', finalQuantity);
                console.log('- finalPrice:', finalPrice);
                
                if (!finalId || !finalQuantity || !finalPrice || isNaN(finalId) || isNaN(finalQuantity) || isNaN(finalPrice)) {
                    errorOccurred = true;
                    console.log('ERROR: Invalid values detected!');
                    return db.rollback(() => {
                        if (!res.headersSent) {
                            res.status(400).json({ 
                                error: `Invalid cart item at index ${idx}`,
                                debug: {
                                    rawItem: item,
                                    extractedValues: { itemId, itemQuantity, itemPrice },
                                    finalValues: { finalId, finalQuantity, finalPrice },
                                    availableProperties: Object.keys(item),
                                    issue: 'One or more values are null, undefined, or NaN'
                                }
                            });
                        }
                    });
                }

                const subtotal = finalPrice * finalQuantity;
                console.log('Calculated subtotal:', subtotal);
                console.log('About to execute SQL with params:', [orderLineId, finalId, finalQuantity, subtotal]);
                console.log('===========================');
                
                db.execute(orderItemSql, [orderLineId, finalId, finalQuantity, subtotal], (err) => {
                    if (err && !errorOccurred) {
                        errorOccurred = true;
                        return db.rollback(() => {
                            if (!res.headersSent) {
                                console.error('Order Item Insert Error:', err);
                                res.status(500).json({ error: 'Error inserting order items', details: err });
                            }
                        });
                    }

                    completed++;

                    // If all items are inserted successfully
                    if (completed === cart.length && !errorOccurred) {
                        // Create order history record
                        const today = new Date();
                        const formattedDate = today.toISOString().slice(0, 10);
                        const orderHistorySql = 'INSERT INTO orderhistory (OrderLineID, UserID, Date) VALUES (?, ?, ?)';
                        console.log('Inserting order history with date:', formattedDate);
                        
                        db.execute(orderHistorySql, [orderLineId, userId, formattedDate], (err) => {
                            if (err) {
                                return db.rollback(() => {
                                    if (!res.headersSent) {
                                        console.error('Order History Insert Error:', err);
                                        res.status(500).json({ error: 'Error creating order history', details: err });
                                    }
                                });
                            }

                            // Update product stocks
                            let stockUpdatesCompleted = 0;
                            let stockUpdateError = false;

                            cart.forEach((item) => {
                                // Handle different possible property names
                                const itemId = item.id || item.productId || item.ProductID || item.item_id || item.product_id;
                                const itemQuantity = item.quantity || item.qty;
                                
                                // Validate item for stock update
                                if (!itemId || !itemQuantity) {
                                    stockUpdateError = true;
                                    return db.rollback(() => {
                                        if (!res.headersSent) {
                                            res.status(400).json({ 
                                                error: `Invalid item for stock update. Missing id or quantity`,
                                                item: item,
                                                debug: {
                                                    itemId,
                                                    itemQuantity,
                                                    availableProperties: Object.keys(item)
                                                }
                                            });
                                        }
                                    });
                                }

                                const updateStockSql = 'UPDATE product SET Stocks = Stocks - ? WHERE ProductID = ? AND Stocks >= ?';
                                console.log('Updating stock:', { productId: itemId, quantity: itemQuantity });
                                
                                db.execute(updateStockSql, [parseInt(itemQuantity), itemId, parseInt(itemQuantity)], (err, result) => {
                                    if (err && !stockUpdateError) {
                                        stockUpdateError = true;
                                        return db.rollback(() => {
                                            if (!res.headersSent) {
                                                console.error('Stock Update Error:', err);
                                                res.status(500).json({ error: 'Error updating product stocks', details: err });
                                            }
                                        });
                                    }

                                    // Check if stock was actually updated (affected rows > 0)
                                    if (result.affectedRows === 0 && !stockUpdateError) {
                                        stockUpdateError = true;
                                        return db.rollback(() => {
                                            if (!res.headersSent) {
                                                res.status(400).json({ 
                                                    error: `Insufficient stock for product ID: ${item.id}` 
                                                });
                                            }
                                        });
                                    }

                                    stockUpdatesCompleted++;

                                    // If all stock updates are completed successfully
                                    if (stockUpdatesCompleted === cart.length && !stockUpdateError) {
                                        // Commit the transaction
                                        db.commit(err => {
                                            if (err) {
                                                return db.rollback(() => {
                                                    if (!res.headersSent) {
                                                        console.error('Commit Error:', err);
                                                        res.status(500).json({ error: 'Commit error', details: err });
                                                    }
                                                });
                                            }

                                            if (!res.headersSent) {
                                                res.status(200).json({
                                                    success: true,
                                                    orderLineId,
                                                    message: 'Order placed successfully.',
                                                    cart
                                                });
                                            }
                                        });
                                    }
                                });
                            });
                        });
                    }
                });
            });
        });
    });
};

// Get order history for a user
exports.getOrderHistory = (req, res) => {
    const { userId } = req.params;

    const sql = `
        SELECT 
            oh.OrderHistoryID,
            ol.OrderLineID,
            ol.Name,
            ol.PhoneNumber,
            ol.ZipCode,
            ol.Address,
            GROUP_CONCAT(
                CONCAT(p.Name, ' (x', oi.Quantity, ')') 
                SEPARATOR ', '
            ) as Items,
            SUM(oi.SubTotal) as TotalAmount
        FROM orderhistory oh
        JOIN orderline ol ON oh.OrderLineID = ol.OrderLineID
        JOIN orderitem oi ON ol.OrderLineID = oi.OrderLineID
        JOIN product p ON oi.ProductID = p.ProductID
        WHERE oh.UserID = ?
        GROUP BY oh.OrderHistoryID, ol.OrderLineID
        ORDER BY oh.OrderHistoryID DESC
    `;

    db.query(sql, [userId], (err, orders) => {
        if (err) {
            console.error('Get Order History Error:', err);
            return res.status(500).json({ message: 'Failed to retrieve order history.' });
        }

        res.status(200).json({ orders });
    });
};

// Get detailed order information
exports.getOrderDetails = (req, res) => {
    const { orderLineId } = req.params;

    // Get order info first
    const orderInfoSql = `
        SELECT 
            ol.OrderLineID,
            ol.Name,
            ol.PhoneNumber,
            ol.ZipCode,
            ol.Address,
            oh.UserID
        FROM orderline ol
        JOIN orderhistory oh ON ol.OrderLineID = oh.OrderLineID
        WHERE ol.OrderLineID = ?
    `;

    db.query(orderInfoSql, [orderLineId], (err, orderInfo) => {
        if (err) {
            console.error('Get Order Info Error:', err);
            return res.status(500).json({ message: 'Failed to retrieve order information.' });
        }

        if (orderInfo.length === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        // Get order items
        const orderItemsSql = `
            SELECT 
                oi.OrderItemID,
                oi.Quantity,
                oi.SubTotal,
                p.ProductID,
                p.Name as ProductName,
                p.Description,
                p.Price,
                c.Category as ProductCategory
            FROM orderitem oi
            JOIN product p ON oi.ProductID = p.ProductID
            JOIN category c ON p.ProdCategoryID = c.ProdCategoryID
            WHERE oi.OrderLineID = ?
        `;

        db.query(orderItemsSql, [orderLineId], (err2, orderItems) => {
            if (err2) {
                console.error('Get Order Items Error:', err2);
                return res.status(500).json({ message: 'Failed to retrieve order items.' });
            }

            const totalAmount = orderItems.reduce((sum, item) => sum + parseFloat(item.SubTotal), 0);

            res.status(200).json({
                orderInfo: orderInfo[0],
                orderItems: orderItems,
                totalAmount: totalAmount
            });
        });
    });
};