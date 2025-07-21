const CartController = {
    addToCart: function(product) {
        const userID = localStorage.getItem('userID'); // ensure this is set during login
        
        if (!userID) {
            Swal.fire({
                icon: 'error',
                title: 'Not Logged In',
                text: 'Please login to add items to cart.'
            });
            return false;
        }

        const payload = {
            ProductID: product.ProductID,
            UserID: parseInt(userID),
            Quantity: 1
        };

        let success = false;

        $.ajax({
            url: 'http://localhost:4000/api/v1/cart/add',
            type: 'POST',
            data: JSON.stringify(payload),
            contentType: 'application/json',
            async: false,
            success: function (res) {
                success = true;
            },
            error: function (err) {
                console.error('Add to cart failed', err);
                success = false;
            }
        });

        return success;
    }
};

$(document).ready(function () {
    const userID = localStorage.getItem("userID");
    if (!userID) return Swal.fire({ icon: 'error', text: 'You must be logged in to view cart' });

    fetchCart();

    $('#clearCartBtn').on('click', function () {
        Swal.fire('Feature Coming Soon', 'Clear cart is not implemented yet.', 'info');
    });

    function fetchCart() {
        $.ajax({
            url: `http://localhost:4000/api/v1/cart/${userID}`,
            type: 'GET',
            success: function (data) {
                renderCart(data);
                updateCartSummary(data);
                $('#cartBadge').text(data.length);
            },
            error: function () {
                $('#cartItems').html('<p class="text-danger">Failed to load cart items.</p>');
            }
        });
    }

    function renderCart(items) {
        if (!items.length) {
            $('#cartItems').html('<p class="text-muted">Your cart is empty.</p>');
            return;
        }

        let html = '<ul class="list-group">';
        items.forEach(item => {
            html += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${item.Name}</strong><br>
                        Price: $${parseFloat(item.Price).toFixed(2)}<br>
                        Quantity: ${item.Quantity}
                    </div>
                    <div>
                        <button class="btn btn-sm btn-danger remove-item" data-id="${item.CartID}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';

        $('#cartItems').html(html);
    }

    function updateCartSummary(items) {
    let totalItems = 0;
    let subtotal = 0;

    items.forEach(item => {
        totalItems += item.Quantity;
        subtotal += item.Quantity * parseFloat(item.Price);
    });

        $('#totalItems').text(totalItems);
        $('#subtotal').text(`$${subtotal.toFixed(2)}`);
        $('#total').text(`$${subtotal.toFixed(2)}`);
    }


    // Remove item
    $(document).on('click', '.remove-item', function () {
        const cartID = $(this).data('id');

        Swal.fire({
            title: 'Remove Item?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, remove it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `http://localhost:4000/api/v1/cart/remove/${cartID}`,
                    type: 'DELETE',
                    success: function () {
                        fetchCart();
                    },
                    error: function () {
                        Swal.fire('Error', 'Could not remove item.', 'error');
                    }
                });
            }
        });
    });
});
