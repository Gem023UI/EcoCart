$(document).ready(function () {
    const url = 'http://localhost:4000/cart';

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

    // Checkout functionality
    $('#checkoutBtn').on('click', function () {
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

        const payload = JSON.stringify({
            userId: getUserId(),
            cart
        });

        $.ajax({
            type: "POST",
            url: `${url}api/v1/create-order`,
            data: payload,
            dataType: "json",
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                Swal.fire({
                    icon: "success",
                    text: data.message || "Order placed successfully!"
                });
                sessionStorage.removeItem('cart');
                renderCart();
            },
            error: function (error) {
                console.error("Checkout Error:", error);
                Swal.fire({
                    icon: "error",
                    text: "Failed to place order. Try again later."
                });
            }
        });
    });

    $(document).ready(function () {
        $("#headerContainer").load("header.html");
    });
});
