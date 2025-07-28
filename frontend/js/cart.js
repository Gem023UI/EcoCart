$(document).ready(function () {
    const url = 'http://localhost:4000';

    function getCart() {
        try {
            let cart = sessionStorage.getItem('cart');
            return cart ? JSON.parse(cart) : [];
        } catch (error) {
            console.error('Error parsing cart from session storage:', error);
            return [];
        }
    }

    function saveCart(cart) {
        try {
            sessionStorage.setItem('cart', JSON.stringify(cart));
        } catch (error) {
            console.error('Error saving cart to sessionStorage:', error);
        }
    }

    function getUserId() {
        return sessionStorage.getItem('userId') ?? '';
    }

    const getToken = () => {
        const userId = sessionStorage.getItem('userId');

        if (!userId) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to access this page.',
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'loginregister.html';
            });
            return;
        }
        return true
    }

    // Initial cart rendering
    renderCart();
    // Debug: Log cart contents on page load
    console.log('Cart contents on page load:', getCart());

    function renderCart() {
        let cart = getCart();
        let html = '';
        let total = 0;
        let itemCount = 0;

        console.log('Rendering cart:', cart); // Debug log

        if (cart.length === 0) {
            html = '<p class="text-muted">Your cart is empty.</p>';
        } else {
            html = `<table class="table table-bordered align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Subtotal</th>
                        <th>Remove</th>
                    </tr>
                </thead>
                <tbody>`;

            cart.forEach((item, idx) => {
                // Ensure we have valid data
                const price = parseFloat(item.price) || 0;
                const quantity = parseInt(item.quantity) || 0;
                const description = item.description || 'Unknown Product';
                
                let subtotal = price * quantity;
                total += subtotal;
                itemCount += quantity;

                html += `<tr>
                    <td>${description}</td>
                    <td>₱ ${price.toFixed(2)}</td>
                    <td>
                        <div class="d-flex align-items-center gap-2">
                            <button class="btn btn-sm btn-secondary qty-decrease" data-idx="${idx}">−</button>
                            <span>${quantity}</span>
                            <button class="btn btn-sm btn-secondary qty-increase" data-idx="${idx}">+</button>
                        </div>
                    </td>
                    <td>₱ ${subtotal.toFixed(2)}</td>
                    <td><button class="btn btn-danger btn-sm remove-item" data-idx="${idx}"><i class="fas fa-trash"></i></button></td>
                </tr>`;
            });

            html += `</tbody></table>`;
        }

        $('#cartItems').html(html);
        $('#totalItems').text(itemCount);
        $('#subtotal').text(`₱ ${total.toFixed(2)}`);
        $('#total').text(`₱ ${total.toFixed(2)}`);
    }

    // Remove item from cart
    $('#cartItems').on('click', '.remove-item', function () {
        let idx = parseInt($(this).data('idx'));
        let cart = getCart();
        
        if (idx >= 0 && idx < cart.length) {
            cart.splice(idx, 1);
            saveCart(cart);
            renderCart();
            
            Swal.fire({
                icon: 'success',
                text: 'Item removed from cart',
                timer: 1000,
                showConfirmButton: false
            });
        }
    });

    // Increase quantity
    $('#cartItems').on('click', '.qty-increase', function () {
        let idx = parseInt($(this).data('idx'));
        let cart = getCart();

        if (idx >= 0 && idx < cart.length) {
            const maxStock = parseInt(cart[idx].stock) || 999;
            
            if (cart[idx].quantity < maxStock) {
                cart[idx].quantity++;
                saveCart(cart);
                renderCart();
            } else {
                Swal.fire({
                    icon: 'warning',
                    text: `Only ${maxStock} in stock.`
                });
            }
        }
    });

    // Decrease quantity
    $('#cartItems').on('click', '.qty-decrease', function () {
        let idx = parseInt($(this).data('idx'));
        let cart = getCart();

        if (idx >= 0 && idx < cart.length) {
            if (cart[idx].quantity > 1) {
                cart[idx].quantity--;
                saveCart(cart);
                renderCart();
            } else {
                Swal.fire({
                    icon: 'info',
                    text: `Minimum quantity is 1.`
                });
            }
        }
    });

    // Clear all cart items
    $('#clearCartBtn').on('click', function () {
        Swal.fire({
            title: 'Clear Cart?',
            text: 'Are you sure you want to remove all items?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, clear it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                sessionStorage.removeItem('cart');
                renderCart();
                Swal.fire('Cleared!', 'Your cart has been emptied.', 'success');
            }
        });
    });

    // Function to show checkout form modal
    function showCheckoutForm() {
        const modalHtml = `
        <div class="modal fade" id="checkoutModal" tabindex="-1" aria-labelledby="checkoutModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="checkoutModalLabel">Checkout Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="checkoutForm">
                            <div class="mb-3">
                                <label for="name" class="form-label">Full Name *</label>
                                <input type="text" class="form-control" id="name" name="name" required>
                            </div>
                            <div class="mb-3">
                                <label for="phoneNumber" class="form-label">Phone Number *</label>
                                <input type="tel" class="form-control" id="phoneNumber" name="phoneNumber" required>
                            </div>
                            <div class="mb-3">
                                <label for="zipCode" class="form-label">Zip Code *</label>
                                <input type="number" class="form-control" id="zipCode" name="zipCode" required>
                            </div>
                            <div class="mb-3">
                                <label for="address" class="form-label">Delivery Address *</label>
                                <textarea class="form-control" id="address" name="address" rows="3" required></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="confirmOrderBtn">Place Order</button>
                    </div>
                </div>
            </div>
        </div>`;

        // Remove existing modal if any
        $('#checkoutModal').remove();
        
        // Add modal to body
        $('body').append(modalHtml);
        
        // Show modal
        $('#checkoutModal').modal('show');
        
        // Handle form submission - IMPORTANT: Use event delegation
        $(document).off('click', '#confirmOrderBtn').on('click', '#confirmOrderBtn', function() {
            console.log('Confirm Order button clicked'); // Debug log
            processCheckout();
        });
    }

    // Process checkout with form data
    function processCheckout() {
        console.log('processCheckout function called'); // Debug log
        
        const form = document.getElementById('checkoutForm');
        if (!form) {
            console.error('Checkout form not found');
            return;
        }
        
        const formData = new FormData(form);
        
        // Validate required fields
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const cart = getCart();
        const userId = getUserId();

        console.log('=== FRONTEND CHECKOUT DEBUG ===');
        console.log('Raw cart from storage:', JSON.stringify(cart, null, 2));
        console.log('User ID:', userId);
        
        // Check if cart is empty or has invalid items
        if (!cart || cart.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'Empty Cart',
                text: 'Your cart is empty. Please add items before checkout.'
            });
            return;
        }

        try {
            const transformedCart = cart.map((item, index) => {
                console.log(`=== TRANSFORMING ITEM ${index} ===`);
                console.log('Original item:', JSON.stringify(item, null, 2));
                console.log('Available properties:', Object.keys(item));
                console.log('Property values:');
                Object.keys(item).forEach(key => {
                    console.log(`  ${key}: ${item[key]} (${typeof item[key]})`);
                });
                
                // Try all possible property names for ID
                const possibleIds = [item.id, item.productId, item.ProductID, item.item_id, item.product_id];
                const possibleQuantities = [item.quantity, item.qty, item.Quantity];
                const possiblePrices = [item.price, item.unit_price, item.Price, item.sell_price];
                
                console.log('Possible IDs found:', possibleIds);
                console.log('Possible quantities found:', possibleQuantities);
                console.log('Possible prices found:', possiblePrices);
                
                const finalId = possibleIds.find(val => val !== undefined && val !== null);
                const finalQuantity = possibleQuantities.find(val => val !== undefined && val !== null);
                const finalPrice = possiblePrices.find(val => val !== undefined && val !== null);
                
                console.log('Selected values:');
                console.log('  ID:', finalId);
                console.log('  Quantity:', finalQuantity);
                console.log('  Price:', finalPrice);
                
                const transformed = {
                    id: finalId,
                    price: parseFloat(finalPrice || 0),
                    quantity: parseInt(finalQuantity || 0)
                };
                
                console.log('Final transformed item:', transformed);
                console.log('=================================');
                
                // Validate the transformed item
                if (!transformed.id || transformed.quantity <= 0 || transformed.price <= 0) {
                    console.error('INVALID TRANSFORMED ITEM:', transformed);
                    throw new Error(`Invalid item at index ${index}: Missing or invalid id, quantity, or price`);
                }
                
                return transformed;
            });

            console.log('All transformed items:', transformedCart);

            const orderData = {
                userId: parseInt(userId),
                cart: transformedCart,
                orderDetails: {
                    name: formData.get('name'),
                    phoneNumber: formData.get('phoneNumber'),
                    zipCode: parseInt(formData.get('zipCode')),
                    address: formData.get('address')
                }
            };

            console.log('Final order data being sent:', JSON.stringify(orderData, null, 2));
            console.log('================================');

            // Validate order data before sending
            if (!orderData.userId || !orderData.cart || orderData.cart.length === 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Order Data',
                    text: 'Please check your cart and try again.'
                });
                return;
            }

            // Disable the button to prevent double submission
            $('#confirmOrderBtn').prop('disabled', true).text('Processing...');

            $.ajax({
                type: "POST",
                url: `${url}/api/v1/create-order`,
                data: JSON.stringify(orderData),
                dataType: "json",
                contentType: 'application/json; charset=utf-8',
                success: function (data) {
                    console.log('Order success response:', data);
                    $('#checkoutModal').modal('hide');
                    Swal.fire({
                        icon: "success",
                        title: "Order Placed!",
                        text: data.message || "Your order has been placed successfully!",
                        confirmButtonText: "OK"
                    }).then(() => {
                        // Clear cart and refresh
                        sessionStorage.removeItem('cart');
                        renderCart();
                    });
                },
                error: function (xhr, status, error) {
                    console.error("=== CHECKOUT ERROR ===");
                    console.error("Status:", status);
                    console.error("Error:", error);
                    console.error("Response Text:", xhr.responseText);
                    console.error("Response JSON:", xhr.responseJSON);
                    console.error("=====================");
                    
                    let errorMessage = "Failed to place order. Please try again.";
                    
                    try {
                        if (xhr.responseJSON && xhr.responseJSON.error) {
                            errorMessage = xhr.responseJSON.error;
                        } else if (xhr.responseJSON && xhr.responseJSON.message) {
                            errorMessage = xhr.responseJSON.message;
                        }
                    } catch (e) {
                        console.error("Error parsing response:", e);
                    }
                    
                    Swal.fire({
                        icon: "error",
                        title: "Order Failed",
                        text: errorMessage
                    });
                },
                complete: function() {
                    // Re-enable the button
                    $('#confirmOrderBtn').prop('disabled', false).text('Place Order');
                }
            });
            
        } catch (error) {
            console.error('Error in processCheckout:', error);
            Swal.fire({
                icon: 'error',
                title: 'Checkout Error',
                text: error.message || 'An error occurred during checkout'
            });
        }
    }

    // Updated checkout button handler
    $('#checkoutBtn').on('click', function () {
        console.log('Checkout button clicked'); // Debug log
        
        let cart = getCart();

        if (!getUserId()) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to proceed to checkout.'
            });
            return;
        }

        if (cart.length === 0) {
            Swal.fire({
                icon: 'info',
                text: 'Your cart is empty.'
            });
            return;
        }

        // Show checkout form instead of direct order
        showCheckoutForm();
    });

    // Load header
    $(document).ready(function () {
        $("#headerContainer").load("header.html");
    });
});